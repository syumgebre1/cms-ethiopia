const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Rate limit for anonymous reports — 3 per hour per IP
const anonymousLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    message:
      'Too many anonymous reports. Please try again in an hour or create an account.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==================== PUBLIC ====================
router.post(
  '/anonymous',
  anonymousLimiter,
  reportController.createAnonymousReport
);

// ==================== AUTHENTICATED ====================
router.use(authenticate);

router.post('/', reportController.createReport);
router.get('/me', reportController.getMyReports);
router.get(
  '/all',
  authorize('officer', 'detective', 'admin'),
  reportController.getAllReports
);
router.get('/:id', reportController.getReportById);
router.patch(
  '/:id/status',
  authorize('officer', 'detective', 'admin'),
  reportController.updateReportStatus
);

module.exports = router;