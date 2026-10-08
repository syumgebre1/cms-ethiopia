const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authenticate = require('../middleware/authenticate');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/contacts', messageController.getContacts);

router.get('/conversations', messageController.listConversations);
router.post('/conversations', messageController.startConversation);
router.get('/conversations/:id', messageController.getMessages);
router.post('/conversations/:id', messageController.sendMessage);

// Upload route with multer error handling
router.post(
  '/conversations/:id/attachment',
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err.message);
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  messageController.sendAttachment
);

router.delete('/:id', messageController.deleteMessage);
router.patch('/:id/read', messageController.markRead);

module.exports = router;