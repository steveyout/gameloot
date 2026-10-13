const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const earningController = require('../controllers/earningController');
const adController = require('../controllers/adController');
const notificationController = require('../controllers/notificationController');
const { verifyAdmin } = require('../middleware/auth');

// All endpoints require admin authorization
router.use(verifyAdmin);

// 1. Dashboard Overview
router.get('/dashboard', adminController.getDashboard);

// 2. Games CRUD
router.get('/games', adminController.getGames);
router.post('/games', adminController.createGame);
router.put('/games/:id', adminController.updateGame);
router.delete('/games/:id', adminController.deleteGame);

// 3. Categories CRUD
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// 4. Users Management & Points Adjustment
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.post('/users/:id/adjust-points', adminController.adjustUserPoints);

// 5. Redemptions Fulfillment
router.get('/redemptions', adminController.getRedemptions);
router.patch('/redemptions/:id', adminController.updateRedemptionStatus);

// 6. Anti-Cheat & Fraud Logs
router.get('/fraud', adminController.getFraudLogs);
router.patch('/fraud/:id', adminController.updateFraudStatus);

// 7. System Settings
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// 8. Quizzes & Trivia CRUD
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

// 11. Google AdMob Placements & Revenue Economics
router.get('/ads', adController.getAdPlacements);
router.put('/ads/:id', adController.updateAdPlacement);

// 12. Push & In-App Broadcast Notifications Engine
router.get('/notifications', notificationController.getAdminNotifications);
router.post('/notifications', notificationController.createAdminNotification);
router.delete('/notifications/:id', notificationController.deleteAdminNotification);

module.exports = router;
