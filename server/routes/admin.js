const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const earningController = require('../controllers/earningController');
const adController = require('../controllers/adController');
const notificationController = require('../controllers/notificationController');
const { verifyAdmin } = require('../middleware/auth');

// Protect all admin endpoints with JWT authentication & admin privileges
router.use(verifyAdmin);

// 1. Dashboard Metrics & Analytics
router.get('/dashboard', adminController.getDashboardStats);

// 2. Games CRUD & Asset Management
router.get('/games', adminController.getGames);
router.get('/games/:id', adminController.getGameById);
router.post('/games', adminController.createGame);
router.put('/games/:id', adminController.updateGame);
router.delete('/games/:id', adminController.deleteGame);
router.post('/games/bulk-action', adminController.bulkGamesAction);
router.post('/upload-image', adminController.uploadImage);

// 3. Categories CRUD
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// 4. Users / Players Management & Economy Ledger
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.post('/users/:id/adjust-points', adminController.adjustUserPoints);
router.post('/users/bulk-action', adminController.bulkUsersAction);

// 5. Reward Redemptions & Payout Approval Processing
router.get('/redemptions', adminController.getRedemptions);
router.patch('/redemptions/:id', adminController.updateRedemptionStatus);
router.post('/redemptions/bulk-action', adminController.bulkRedemptionsAction);

// 6. Fraud Detection & Anti-Cheat Review
router.get('/fraud', adminController.getFraudLogs);
router.patch('/fraud/:id', adminController.updateFraudStatus);

// 7. System Settings & Sustainable Economics
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// 8. Trivia Quizzes CRUD
router.get('/quizzes', earningController.getQuizzes);
router.post('/quizzes', earningController.createQuiz);
router.put('/quizzes/:id', earningController.updateQuiz);
router.delete('/quizzes/:id', earningController.deleteQuiz);

// 9. Web Surf Tasks CRUD
router.get('/surf-tasks', earningController.getSurfTasks);
router.post('/surf-tasks', earningController.createSurfTask);
router.put('/surf-tasks/:id', earningController.updateSurfTask);
router.delete('/surf-tasks/:id', earningController.deleteSurfTask);

// 10. Surveys CRUD
router.get('/surveys', earningController.getSurveys);
router.post('/surveys', earningController.createSurvey);
router.put('/surveys/:id', earningController.updateSurvey);
router.delete('/surveys/:id', earningController.deleteSurvey);

// 11. Comprehensive Ad Management, Multi-Network Configuration & Economics
router.get('/ads', adController.getAdPlacements);
router.get('/ads/config', adController.getAdminAdConfig);
router.put('/ads/config', adController.updateAdminAdConfig);
router.post('/ads/toggle', adController.toggleGlobalAds);
router.post('/ads/placement', adController.createAdPlacement);
router.put('/ads/placement/:id', adController.updateAdPlacement);
router.delete('/ads/placement/:id', adController.deleteAdPlacement);
router.put('/ads/:id', adController.updateAdPlacement);

// 12. Push & In-App Broadcast Notifications Engine
router.get('/notifications', notificationController.getAdminNotifications);
router.post('/notifications', notificationController.createAdminNotification);
router.delete('/notifications/:id', notificationController.deleteAdminNotification);

module.exports = router;
