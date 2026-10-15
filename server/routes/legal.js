const express = require('express');
const router = express.Router();
const legalController = require('../controllers/legalController');

// Privacy Policy endpoints (HTML & JSON supported) - 100% Public, No Login Required
router.get('/privacy', legalController.getPrivacyPolicy);
router.get('/privacy-policy', legalController.getPrivacyPolicy);
router.get('/legal/privacy', legalController.getPrivacyPolicy);

// Terms of Service endpoints (HTML & JSON supported) - 100% Public, No Login Required
router.get('/terms', legalController.getTermsOfService);
router.get('/terms-of-service', legalController.getTermsOfService);
router.get('/tos', legalController.getTermsOfService);
router.get('/legal/terms', legalController.getTermsOfService);
router.get('/legal/tos', legalController.getTermsOfService);

// Google Play Account & Data Deletion endpoints (HTML & JSON supported) - 100% Public, No Login Required
router.get('/delete-account', legalController.getDeleteAccountPage);
router.get('/account-deletion', legalController.getDeleteAccountPage);
router.get('/delete_account', legalController.getDeleteAccountPage);
router.get('/account/delete', legalController.getDeleteAccountPage);
router.get('/legal/delete-account', legalController.getDeleteAccountPage);
router.get('/legal/account-deletion', legalController.getDeleteAccountPage);

// POST Submission Handlers for Account Deletion
router.post('/delete-account', legalController.handleDeleteAccountRequest);
router.post('/account-deletion', legalController.handleDeleteAccountRequest);
router.post('/delete_account', legalController.handleDeleteAccountRequest);
router.post('/account/delete', legalController.handleDeleteAccountRequest);
router.post('/legal/delete-account', legalController.handleDeleteAccountRequest);
router.post('/legal/account-deletion', legalController.handleDeleteAccountRequest);

module.exports = router;
