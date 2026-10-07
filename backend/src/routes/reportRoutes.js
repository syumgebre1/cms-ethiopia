const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// POST /api/v1/reports — any logged-in user
router.post('/', authenticate, reportController.createReport);

// GET /api/v1/reports/me — only my own reports
router.get('/me', authenticate, reportController.getMyReports);

// GET /api/v1/reports/all — officers, detectives, admins only
router.get(
  '/all',
  authenticate,
  authorize('officer', 'detective', 'admin'),
  reportController.getAllReports
);

module.exports = router;