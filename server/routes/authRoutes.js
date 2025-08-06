const express = require('express');
const { register, login,getUserInfo, savePublicKey} = require('../controllers/authController');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', register);
router.post('/signin', login);
router.get('/user-info',authMiddleware,getUserInfo);
router.post('/public-key', authMiddleware, savePublicKey);
module.exports = router;