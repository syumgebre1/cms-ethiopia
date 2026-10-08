const { Op } = require('sequelize');
const { User, Conversation, Message } = require('../models');
const { isUserOnline } = require('../socket');

const findOrCreateConversation = async (userId, otherUserId) => {
  if (userId === otherUserId) throw new Error('Cannot message yourself');
  const [user1_id, user2_id] =
    userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];
  let conversation = await Conversation.findOne({
    where: { user1_id, user2_id },
  });
  if (!conversation) {
    conversation = await Conversation.create({ user1_id, user2_id });
  }
  return conversation;
};

// GET /api/v1/messages/contacts
exports.getContacts = async (req, res) => {
  try {
    const me = req.user;
    let whereClause = {};
    if (me.role === 'citizen') {
      whereClause.role = { [Op.in]: ['officer', 'detective', 'admin'] };
    } else {
      whereClause.id = { [Op.ne]: me.id };
    }
    const contacts = await User.findAll({
      where: whereClause,
      attributes: ['id', 'full_name', 'email', 'role'],
      order: [['full_name', 'ASC']],
    });
    const withPresence = contacts.map((c) => ({
      ...c.toJSON(),
      is_online: isUserOnline(c.id),
    }));
    res.json({ data: { contacts: withPresence } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/v1/messages/conversations
exports.listConversations = async (req, res) => {
  try {
    const myId = req.user.id;
    const conversations = await Conversation.findAll({
      where: { [Op.or]: [{ user1_id: myId }, { user2_id: myId }] },
      include: [
        { model: User, as: 'user1', attributes: ['id', 'full_name', 'role'] },
        { model: User, as: 'user2', attributes: ['id', 'full_name', 'role'] },
      ],
    });

    const result = await Promise.all(
      conversations.map(async (c) => {
        const other = c.user1_id === myId ? c.user2 : c.user1;
        const lastMessage = await Message.findOne({
          where: { conversation_id: c.id, is_deleted: false },
          include: [
            { model: User, as: 'sender', attributes: ['id', 'full_name'] },
          ],
          order: [['createdAt', 'DESC']],
        });
        const unreadCount = await Message.count({
          where: {
            conversation_id: c.id,
            sender_id: { [Op.ne]: myId },
            is_read: false,
            is_deleted: false,
          },
        });
        return {
          id: c.id,
          other_user: {
            ...other.toJSON(),
            is_online: isUserOnline(other.id),
          },
          last_message: lastMessage,
          unread_count: unreadCount,
          last_message_at: c.last_message_at,
        };
      })
    );

    result.sort((a, b) => {
      const ta = a.last_message_at ? new Date(a.last_message_at) : 0;
      const tb = b.last_message_at ? new Date(b.last_message_at) : 0;
      return tb - ta;
    });

    res.json({ data: { conversations: result } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/v1/messages/conversations
exports.startConversation = async (req, res) => {
  try {
    const { otherUserId } = req.body;
    if (!otherUserId)
      return res.status(400).json({ message: 'otherUserId required' });

    const other = await User.findByPk(otherUserId, {
      attributes: ['id', 'full_name', 'email', 'role'],
    });
    if (!other) return res.status(404).json({ message: 'User not found' });

    if (req.user.role === 'citizen' && other.role === 'citizen') {
      return res
        .status(403)
        .json({ message: 'Citizens cannot message other citizens' });
    }

    const conversation = await findOrCreateConversation(
      req.user.id,
      otherUserId
    );
    res.json({
      data: {
        conversation: {
          id: conversation.id,
          other_user: {
            ...other.toJSON(),
            is_online: isUserOnline(other.id),
          },
        },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/v1/messages/conversations/:id
exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const myId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const conversation = await Conversation.findByPk(id, {
      include: [
        { model: User, as: 'user1', attributes: ['id', 'full_name', 'role'] },
        { model: User, as: 'user2', attributes: ['id', 'full_name', 'role'] },
      ],
    });
    if (!conversation)
      return res.status(404).json({ message: 'Conversation not found' });

    const isParticipant =
      conversation.user1_id === myId || conversation.user2_id === myId;
    if (!isParticipant && !isAdmin)
      return res.status(403).json({ message: 'Access denied' });

    const messages = await Message.findAll({
      where: { conversation_id: id },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'full_name', 'role'] },
      ],
      order: [['createdAt', 'ASC']],
    });

    if (isParticipant) {
      await Message.update(
        { is_read: true },
        {
          where: {
            conversation_id: id,
            sender_id: { [Op.ne]: myId },
            is_read: false,
          },
        }
      );
    }

    const other =
      conversation.user1_id === myId
        ? conversation.user2
        : conversation.user1;

    res.json({
      data: {
        conversation: {
          id: conversation.id,
          other_user: {
            ...other.toJSON(),
            is_online: isUserOnline(other.id),
          },
        },
        messages,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/v1/messages/conversations/:id  (text message)
exports.sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body;
    const myId = req.user.id;

    if (!body || !body.trim())
      return res.status(400).json({ message: 'Message body required' });

    const conversation = await Conversation.findByPk(id);
    if (!conversation)
      return res.status(404).json({ message: 'Conversation not found' });

    const isParticipant =
      conversation.user1_id === myId || conversation.user2_id === myId;
    if (!isParticipant) return res.status(403).json({ message: 'Access denied' });

    const message = await Message.create({
      conversation_id: id,
      sender_id: myId,
      body: body.trim(),
    });
    conversation.last_message_at = new Date();
    await conversation.save();

    const fullMessage = await Message.findByPk(message.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'full_name', 'role'] },
      ],
    });

    const io = req.app.get('io');
    if (io) io.to(`conversation:${id}`).emit('message:new', fullMessage);

    res.status(201).json({ data: { message: fullMessage } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/v1/messages/conversations/:id/attachment  (file message)
exports.sendAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const myId = req.user.id;
    const file = req.file;
    const { caption } = req.body;

    if (!file)
      return res.status(400).json({ message: 'No file uploaded' });

    const conversation = await Conversation.findByPk(id);
    if (!conversation)
      return res.status(404).json({ message: 'Conversation not found' });

    const isParticipant =
      conversation.user1_id === myId || conversation.user2_id === myId;
    if (!isParticipant) return res.status(403).json({ message: 'Access denied' });

    // Public URL
    const attachment_url = `/uploads/messages/${file.filename}`;

    const message = await Message.create({
      conversation_id: id,
      sender_id: myId,
      body: caption || null,
      attachment_url,
      attachment_name: file.originalname,
      attachment_type: file.mimetype,
    });

    conversation.last_message_at = new Date();
    await conversation.save();

    const fullMessage = await Message.findByPk(message.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'full_name', 'role'] },
      ],
    });

    const io = req.app.get('io');
    if (io) io.to(`conversation:${id}`).emit('message:new', fullMessage);

    res.status(201).json({ data: { message: fullMessage } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/v1/messages/:id
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findByPk(id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender_id !== req.user.id)
      return res.status(403).json({ message: 'Can only delete your own' });

    message.is_deleted = true;
    message.body = 'This message was deleted';
    message.attachment_url = null;
    await message.save();

    const io = req.app.get('io');
    if (io)
      io.to(`conversation:${message.conversation_id}`).emit('message:deleted', {
        id: message.id,
      });

    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/v1/messages/:id/read
exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findByPk(id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender_id === req.user.id)
      return res.status(400).json({ message: 'Cannot mark own message' });

    message.is_read = true;
    await message.save();
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};