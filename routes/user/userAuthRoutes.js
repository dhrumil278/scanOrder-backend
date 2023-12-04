const express = require('express');
const {
  login,
  emailVerification,
  forgotPassword,
  verifyForgotEmail,
  changeForgotPassword,
} = require('../../api/controllers/user/userAuthController');
const { hasToken } = require('../../api/middlewares/auth/hasToken');
const { isAuthorized } = require('../../api/middlewares/auth/isAuthorized');

const router = express.Router();

router.post('/login', login);
router.post('/emailVerification', hasToken, isAuthorized, emailVerification);
router.post('/forgotPassword', forgotPassword);
router.post('/verifyForgotEmail', hasToken, isAuthorized, verifyForgotEmail);
router.post(
  '/changeForgotPassword',
  hasToken,
  isAuthorized,
  changeForgotPassword,
);

module.exports = router;
