const express = require('express');
const {
  viewController: { getOverview, getTour, getLoginForm, getMe },
  authController: { isLoggedIn, protect }
} = require('../controllers');

const router = express.Router();

router.get('/', isLoggedIn, getOverview);
router.get('/login', isLoggedIn, getLoginForm);
router.get('/tour/:slug', isLoggedIn, getTour);
router.get('/me', protect, getMe);

module.exports = router;
