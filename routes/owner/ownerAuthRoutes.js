const express = require('express');
const { hasToken } = require('../../api/middlewares/auth/hasToken');
const { isAuthorized } = require('../../api/middlewares/auth/isAuthorized');
const {
  ownerLogin,
  ownerEmailVerification,
  ownerForgotPassword,
  ownerVerifyForgotEmail,
  ownerChangeForgotPassword,
} = require('../../api/controllers/owner/ownerAuthController');

const router = express.Router();

router.post('/login', ownerLogin);
router.post(
  '/emailVerification',
  hasToken,
  isAuthorized,
  ownerEmailVerification,
);
router.post('/forgotPassword', ownerForgotPassword);
router.post(
  '/verifyForgotEmail',
  hasToken,
  isAuthorized,
  ownerVerifyForgotEmail,
);
router.post(
  '/changeForgotPassword',
  hasToken,
  isAuthorized,
  ownerChangeForgotPassword,
);

module.exports = router;
