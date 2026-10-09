const { Op } = require('sequelize');
const { User, Conversation, Message } = require('../models');
const { notify } = require('../utils/notify');

// POST /api/v1/admin/users
exports.createUser = async (req, res) => {
  try {
    const { email, password, full_name, phone, national_id, role } = req.body;

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['officer', 'detective', 'admin'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Must be officer, detective, or admin',
      });
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      email,
      password_hash: password,
      full_name,
      phone,
      national_id,
      role,
      is_verified: true,
    });

    res.status(201).json({
      message: 'User created successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_verified: user.is_verified,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/v1/admin/users
exports.listUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        'id',
        'email',
        'full_name',
        'phone',
        'role',
        'is_verified',
        'is_locked',
        'createdAt',
      ],
      order: [
        ['is_verified', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });

    res.json({ data: { users } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/v1/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, is_locked, is_verified } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (role) {
      if (!['citizen', 'officer', 'detective', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      user.role = role;
    }
    if (typeof is_locked === 'boolean') user.is_locked = is_locked;
    if (typeof is_verified === 'boolean') user.is_verified = is_verified;

    await user.save();
    res.json({ message: 'User updated', data: { user } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/v1/admin/users/:id/approve
exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.is_verified) {
      return res.status(400).json({ message: 'User is already approved' });
    }

    user.is_verified = true;
    await user.save();

    // Send notification to the user
    const io = req.app.get('io');
    if (io) {
      await notify(io, user.id, {
        type: 'account_created',
        title: 'Account Approved! ✅',
        body: 'Your account has been approved by the police department. You can now report crimes and contact officers.',
        link: '/dashboard',
      });
    }

    res.json({
      message: `${user.full_name} has been approved`,
      data: { user },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/v1/admin/users/:id/reject
exports.rejectUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ message: 'Cannot reject yourself' });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only reject unapproved citizens
    if (user.role !== 'citizen') {
      return res
        .status(400)
        .json({ message: 'Can only reject citizen accounts' });
    }

    if (user.is_verified) {
      return res
        .status(400)
        .json({ message: 'Cannot reject an approved user' });
    }

    const name = user.full_name;
    await user.destroy();

    res.json({
      message: `Registration for ${name} was rejected and the account was deleted`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/v1/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/v1/admin/users/:id/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password_hash = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/v1/admin/conversations
exports.listAllConversations = async (req, res) => {
  try {
    const { search } = req.query;

    const conversations = await Conversation.findAll({
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'full_name', 'email', 'role'],
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'full_name', 'email', 'role'],
        },
      ],
      order: [['last_message_at', 'DESC']],
    });

    const result = await Promise.all(
      conversations.map(async (c) => {
        const lastMessage = await Message.findOne({
          where: { conversation_id: c.id },
          order: [['createdAt', 'DESC']],
        });

        const messageCount = await Message.count({
          where: { conversation_id: c.id, is_deleted: false },
        });

        return {
          id: c.id,
          user1: c.user1,
          user2: c.user2,
          last_message: lastMessage,
          message_count: messageCount,
          last_message_at: c.last_message_at,
        };
      })
    );

    let filtered = result;
    if (search && search.trim()) {
      const q = search.toLowerCase();
      filtered = result.filter(
        (r) =>
          r.user1?.full_name?.toLowerCase().includes(q) ||
          r.user2?.full_name?.toLowerCase().includes(q) ||
          r.user1?.email?.toLowerCase().includes(q) ||
          r.user2?.email?.toLowerCase().includes(q)
      );
    }

    res.json({ data: { conversations: filtered } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/v1/admin/conversations/:id
exports.getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'full_name', 'email', 'role'],
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'full_name', 'email', 'role'],
        },
      ],
    });

    if (!conversation)
      return res.status(404).json({ message: 'Conversation not found' });

    const messages = await Message.findAll({
      where: { conversation_id: id },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'full_name', 'role'] },
      ],
      order: [['createdAt', 'ASC']],
    });

    res.json({
      data: {
        conversation: {
          id: conversation.id,
          user1: conversation.user1,
          user2: conversation.user2,
        },
        messages,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};