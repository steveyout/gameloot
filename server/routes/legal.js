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

module.exports = router;
