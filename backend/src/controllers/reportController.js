const { Report, User, ReportEvidence } = require('../models');
const { notify, notifyRoles } = require('../utils/notify');

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

    const io = req.app.get('io');
    await notifyRoles(io, ['officer', 'detective', 'admin'], {
      type: 'report_created',
      title: 'New Report Submitted',
      body: `${crime_type} reported at ${location}`,
      link: `/reports/${report.id}`,
    });

    res.status(201).json({
      message: 'Report submitted successfully',
      data: { report },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/v1/reports/anonymous
exports.createAnonymousReport = async (req, res) => {
  try {
    const { crime_type, description, location, urgency, latitude, longitude } =
      req.body;

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

    const io = req.app.get('io');
    await notifyRoles(io, ['officer', 'detective', 'admin'], {
      type: 'report_created',
      title: 'New Anonymous Report',
      body: `${crime_type} reported at ${location}`,
      link: `/reports/${report.id}`,
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
      include: [
        {
          model: ReportEvidence,
          as: 'evidence',
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ data: { reports } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/v1/reports/all
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.findAll({
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'full_name', 'email'],
        },
        {
          model: ReportEvidence,
          as: 'evidence',
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
        {
          model: ReportEvidence,
          as: 'evidence',
          include: [
            {
              model: User,
              as: 'uploader',
              attributes: ['id', 'full_name', 'role'],
            },
          ],
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

    const oldStatus = report.status;
    report.status = status;
    await report.save();

    if (oldStatus !== status && report.user_id) {
      const io = req.app.get('io');
      await notify(io, report.user_id, {
        type: 'report_status_changed',
        title: 'Report Status Updated',
        body: `Your ${report.crime_type} report is now: ${status.replace(
          '_',
          ' '
        )}`,
        link: `/reports/${report.id}`,
      });
    }

    res.json({ message: 'Status updated', data: { report } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/v1/reports/:id/evidence
exports.uploadEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const report = await Report.findByPk(id);
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

    const created = [];
    for (const file of files) {
      const evidence = await ReportEvidence.create({
        report_id: id,
        uploaded_by: req.user.id,
        file_url: `/uploads/evidence/${file.filename}`,
        file_name: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
      });
      created.push(evidence);
    }

    res.status(201).json({
      message: `${created.length} file(s) uploaded`,
      data: { evidence: created },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/v1/reports/evidence/:evidenceId
exports.deleteEvidence = async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const evidence = await ReportEvidence.findByPk(evidenceId);

    if (!evidence) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    const isUploader = evidence.uploaded_by === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isUploader && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'Can only delete your own uploads' });
    }

    await evidence.destroy();
    res.json({ message: 'Evidence deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};