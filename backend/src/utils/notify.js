const { Notification, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Create a notification and emit it via Socket.IO to the target user
 */
const notify = async (io, userId, { type, title, body, link }) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      type,
      title,
      body,
      link,
    });

    if (io) {
      io.to(`user:${userId}`).emit('notification:new', notification);
    }

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

/**
 * Notify all users with specific roles
 */
const notifyRoles = async (io, roles, payload) => {
  try {
    const users = await User.findAll({
      where: { role: { [Op.in]: roles } },
      attributes: ['id'],
    });

    for (const u of users) {
      await notify(io, u.id, payload);
    }
  } catch (err) {
    console.error('Failed to notify roles:', err.message);
  }
};

module.exports = { notify, notifyRoles };