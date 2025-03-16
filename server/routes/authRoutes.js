const express = require('express');
const { register, login,getUserInfo} = require('../controllers/authController');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/user-info',authMiddleware,getUserInfo);
module.exports = router;