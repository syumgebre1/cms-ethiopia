const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const uploadAvatar = require('../middleware/uploadAvatar');

// Public
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected
router.get('/me', authenticate, authController.me);
router.patch('/change-password', authenticate, authController.changePassword);
router.patch('/profile', authenticate, authController.updateProfile);
router.post(
  '/avatar',
  authenticate,
  uploadAvatar.single('avatar'),
  authController.uploadAvatar
);
router.delete('/avatar', authenticate, authController.deleteAvatar);

module.exports = router;