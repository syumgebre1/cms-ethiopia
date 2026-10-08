const { Report, User } = require('../models');

// POST /api/v1/reports
exports.createReport = async (req, res) => {
  try {
    const {
      crime_type,
      description,
      location,
      urgency,
      is_anonymous,
      latitude,
      longitude,
    } = req.body;

    if (!crime_type || !description || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const report = await Report.create({
      crime_type,
      description,
      location,
      urgency: urgency || 'medium',
      is_anonymous: is_anonymous || false,
      user_id: is_anonymous ? null : req.user.id,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    });

    res.status(201).json({
      message: 'Report submitted successfully',
      data: { report },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/v1/reports/anonymous — PUBLIC
exports.createAnonymousReport = async (req, res) => {
  try {
    const {
      crime_type,
      description,
      location,
      urgency,
      latitude,
      longitude,
    } = req.body;

    if (!crime_type || !description || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const report = await Report.create({
      crime_type,
      description,
      location,
      urgency: urgency || 'medium',
      is_anonymous: true,
      user_id: null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    });

    res.status(201).json({
      message: 'Anonymous report submitted successfully',
      data: {
        report: {
          id: report.id,
          crime_type: report.crime_type,
          reference: `ANON-${report.id.slice(0, 8).toUpperCase()}`,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/v1/reports/me
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json({ data: { reports } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/v1/reports/all (staff)
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.findAll({
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'full_name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ data: { reports } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/v1/reports/:id
exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findByPk(id, {
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'full_name', 'email', 'phone'],
        },
      ],
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const isOwner = report.user_id === req.user.id;
    const isStaff =
      req.user.role === 'officer' ||
      req.user.role === 'detective' ||
      req.user.role === 'admin';

    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ data: { report } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/v1/reports/:id/status
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = [
      'pending',
      'under_review',
      'escalated',
      'resolved',
      'rejected',
    ];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    await report.save();

    res.json({ message: 'Status updated', data: { report } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};