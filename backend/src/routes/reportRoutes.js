const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const uploadEvidence = require('../middleware/uploadEvidence');

const anonymousLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    message:
      'Too many anonymous reports. Please try again in an hour or create an account.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public
router.post(
  '/anonymous',
  anonymousLimiter,
  reportController.createAnonymousReport
);

// Authenticated
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

// Evidence upload
router.post(
  '/:id/evidence',
  uploadEvidence.array('files', 5),
  reportController.uploadEvidence
);
router.delete('/evidence/:evidenceId', reportController.deleteEvidence);

module.exports = router;