const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate, authorize('admin'));

// User management
router.post('/users', adminController.createUser);
router.get('/users', adminController.listUsers);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/reset-password', adminController.resetPassword);

// Conversation audit
router.get('/conversations', adminController.listAllConversations);
router.get('/conversations/:id', adminController.getConversationMessages);

module.exports = router;