const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const alertController = require('../controllers/alertController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// ==================== Multer for alert photos ====================
const ALERT_DIR = path.join(__dirname, '../../uploads/alerts');
if (!fs.existsSync(ALERT_DIR)) {
  fs.mkdirSync(ALERT_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ALERT_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ==================== PUBLIC route (no auth) ====================
router.get('/public', alertController.getPublicAlerts);

// ==================== STAFF routes (admin + detective) ====================
router.get(
  '/',
  authenticate,
  authorize('admin', 'detective'),
  alertController.listAlerts
);

router.post(
  '/',
  authenticate,
  authorize('admin', 'detective'),
  upload.single('photo'),
  alertController.createAlert
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'detective'),
  upload.single('photo'),
  alertController.updateAlert
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'detective'),
  alertController.deleteAlert
);

module.exports = router;