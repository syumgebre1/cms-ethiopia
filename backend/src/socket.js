const { verifyAccessToken } = require('./utils/tokenUtils');
const { User } = require('./models');

const onlineUsers = new Map();

const setupSocket = (io) => {
  // ==================== Auth Middleware ====================
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'full_name', 'email', 'role'],
      });

      if (!user) return next(new Error('User not found'));
      if (user.is_locked) return next(new Error('Account locked'));

      socket.user = user.toJSON();
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // ==================== Connection ====================
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`🟢 Connected: ${socket.user.full_name}`);

    // Track online
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Join personal room for notifications
    socket.join(`user:${userId}`);

    io.emit('presence:online', { userId });

    // ==================== Conversation rooms ====================
    socket.on('conversation:join', ({ conversationId }) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ==================== Typing ====================
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId: socket.user.id,
        userName: socket.user.full_name,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId: socket.user.id,
      });
    });

    // ==================== Disconnect ====================
    socket.on('disconnect', () => {
      console.log(`🔴 Disconnected: ${socket.user.full_name}`);

      const set = onlineUsers.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          onlineUsers.delete(userId);
          io.emit('presence:offline', { userId });
        }
      }
    });
  });
};

const isUserOnline = (userId) => onlineUsers.has(userId);

module.exports = { setupSocket, isUserOnline };