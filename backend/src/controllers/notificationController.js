const { Op } = require('sequelize');
const { Notification } = require('../models');

// GET /api/v1/notifications
exports.list = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    const unreadCount = await Notification.count({
      where: { user_id: req.user.id, is_read: false },
    });

    res.json({ data: { notifications, unreadCount } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/v1/notifications/unread-count
exports.unreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { user_id: req.user.id, is_read: false },
    });
    res.json({ data: { count } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/v1/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    notification.is_read = true;
    await notification.save();

    res.json({ message: 'Marked as read', data: { notification } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/v1/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/v1/notifications/:id
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await notification.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/v1/notifications (clear all)
exports.clearAll = async (req, res) => {
  try {
    await Notification.destroy({ where: { user_id: req.user.id } });
    res.json({ message: 'All cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};