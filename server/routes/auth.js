const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyAdmin, verifyUser } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');

// Admin Auth
router.post('/admin/login', authLimiter, authController.adminLogin);
router.get('/admin/me', verifyAdmin, authController.adminMe);

// Player Mobile Auth
router.post('/user/register', authLimiter, authController.userRegister);
router.post('/user/login', authLimiter, authController.userLogin);

module.exports = router;
