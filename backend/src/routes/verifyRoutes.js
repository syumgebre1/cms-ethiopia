const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/verifyController');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/status', verifyController.getStatus);
router.post('/send', verifyController.sendCode);
router.post('/confirm', verifyController.confirmCode);

module.exports = router;