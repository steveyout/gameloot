const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const adController = require('../controllers/adController');
const notificationController = require('../controllers/notificationController');
const engagementController = require('../controllers/engagementController');
const legalController = require('../controllers/legalController');
const { verifyUser } = require('../middleware/auth');
const { sessionPingLimiter } = require('../middleware/security');

// App Version & Forced Update Checker
router.get('/app-version', clientController.checkAppUpdate);
router.post('/app-version', clientController.checkAppUpdate);

// Discovery
router.get('/categories', clientController.getCategories);
router.get('/games', clientController.getGames);
router.get('/leaderboard/games', clientController.getGameLeaderboard);
router.get('/leaderboard/players', clientController.getPlayerLeaderboard);
router.get('/rewards', clientController.getRewards);
router.get('/quizzes', clientController.getQuizzes);
router.get('/surf-tasks', clientController.getSurfTasks);
router.get('/surveys', clientController.getSurveys);

// Legal & Compliance (JSON & HTML) - 100% Public, No Login Required
router.get('/privacy', legalController.getPrivacyPolicy);
router.get('/privacy-policy', legalController.getPrivacyPolicy);
router.get('/terms', legalController.getTermsOfService);
router.get('/terms-of-service', legalController.getTermsOfService);
router.get('/tos', legalController.getTermsOfService);
router.get('/legal/privacy', legalController.getPrivacyPolicy);
router.get('/legal/terms', legalController.getTermsOfService);
router.get('/legal/tos', legalController.getTermsOfService);

// AdMob Configuration & Verification
router.get('/ads/config', adController.getClientAdConfig);
router.post('/ads/claim', verifyUser, adController.claimRewardedAd);

// Authenticated Mobile Play-to-Earn sessions
router.post('/session/start', verifyUser, clientController.startSession);
router.post('/session/ping', verifyUser, sessionPingLimiter, clientController.pingSession);
router.post('/session/claim', verifyUser, clientController.claimSession);

// Task Claiming
router.post('/quiz/claim', verifyUser, clientController.claimQuiz);
router.post('/surf/claim', verifyUser, clientController.claimSurf);
router.post('/survey/claim', verifyUser, clientController.claimSurvey);

// Cashout / Redemption
router.post('/rewards/redeem', verifyUser, clientController.redeemReward);

// In-App Notifications & Bonus Drops (Real-time synced)
router.get('/notifications', verifyUser, notificationController.getClientNotifications);
router.post('/notifications/mark-read', verifyUser, notificationController.markNotificationRead);
router.post('/notifications/mark-all-read', verifyUser, notificationController.markAllNotificationsRead);
router.post('/notifications/claim-bonus', verifyUser, notificationController.claimNotificationBonus);

// Daily Retention Hooks: Daily Streak & Check-in
router.get('/streak', verifyUser, engagementController.getStreakStatus);
router.post('/streak/checkin', verifyUser, engagementController.claimDailyStreak);

// Daily Retention Hooks: Lucky Spin Wheel
router.get('/wheel', verifyUser, engagementController.getWheelStatus);
router.post('/wheel/spin', verifyUser, engagementController.spinLuckyWheel);

// VIP Rank Progression
router.get('/vip', verifyUser, engagementController.getVipStatus);

module.exports = router;
