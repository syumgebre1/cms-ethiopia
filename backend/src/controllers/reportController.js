const { Report, User } = require('../models');

// POST /api/v1/reports
exports.createReport = async (req, res) => {
  try {
    const { crime_type, description, location, urgency, is_anonymous } = req.body;

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
    });

    res.status(201).json({
      message: 'Report submitted successfully',
      data: { report },
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

// GET /api/v1/reports/all (staff only)
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