const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Route to register a new user
router.post('/register', authController.register);

// Route to log in a user
router.post('/login', authController.login);

router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;
