const { Op } = require('sequelize');
const { PublicAlert, User } = require('../models');
const { notifyRoles } = require('../utils/notify');

// ==================== PUBLIC ====================
exports.getPublicAlerts = async (req, res) => {
  try {
    const { type, search } = req.query;

    const where = { status: { [Op.ne]: 'archived' } };

    if (type && ['fugitive', 'missing', 'wanted', 'announcement'].includes(type)) {
      where.type = type;
    }

    if (search && search.trim()) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { full_name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { last_seen_location: { [Op.like]: `%${search}%` } },
      ];
    }

    const alerts = await PublicAlert.findAll({
      where,
      include: [
        { model: User, as: 'poster', attributes: ['id', 'full_name', 'role'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ data: { alerts } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==================== STAFF ====================
exports.listAlerts = async (req, res) => {
  try {
    const alerts = await PublicAlert.findAll({
      include: [
        { model: User, as: 'poster', attributes: ['id', 'full_name', 'role'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ data: { alerts } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createAlert = async (req, res) => {
  try {
    const {
      type,
      title,
      full_name,
      age,
      description,
      last_seen_location,
      reward,
      status,
    } = req.body;

    if (!type || !title || !description) {
      return res
        .status(400)
        .json({ message: 'Type, title, and description are required' });
    }

    const photo_url = req.file
      ? `/uploads/alerts/${req.file.filename}`
      : null;

    const alert = await PublicAlert.create({
      type,
      title,
      full_name,
      age: age ? parseInt(age) : null,
      description,
      photo_url,
      last_seen_location,
      reward,
      status: status || 'active',
      posted_by: req.user.id,
    });

    const full = await PublicAlert.findByPk(alert.id, {
      include: [
        { model: User, as: 'poster', attributes: ['id', 'full_name', 'role'] },
      ],
    });

    // Notify all citizens about the new alert
    const io = req.app.get('io');
    await notifyRoles(io, ['citizen'], {
      type: 'alert_published',
      title: `New ${type} Alert`,
      body: title,
      link: '/',
    });

    res.status(201).json({ message: 'Alert created', data: { alert: full } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await PublicAlert.findByPk(id);

    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    if (alert.posted_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Can only edit your own alerts' });
    }

    const {
      type,
      title,
      full_name,
      age,
      description,
      last_seen_location,
      reward,
      status,
    } = req.body;

    if (type) alert.type = type;
    if (title) alert.title = title;
    if (full_name !== undefined) alert.full_name = full_name;
    if (age !== undefined) alert.age = age ? parseInt(age) : null;
    if (description) alert.description = description;
    if (last_seen_location !== undefined)
      alert.last_seen_location = last_seen_location;
    if (reward !== undefined) alert.reward = reward;
    if (status) alert.status = status;

    if (req.file) {
      alert.photo_url = `/uploads/alerts/${req.file.filename}`;
    }

    await alert.save();

    const updated = await PublicAlert.findByPk(id, {
      include: [
        { model: User, as: 'poster', attributes: ['id', 'full_name', 'role'] },
      ],
    });

    res.json({ message: 'Alert updated', data: { alert: updated } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await PublicAlert.findByPk(id);

    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    if (alert.posted_by !== req.user.id && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ message: 'Can only delete your own alerts' });
    }

    await alert.destroy();
    res.json({ message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};