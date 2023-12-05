const express = require('express');
const { hasToken } = require('../../api/middlewares/auth/hasToken');
const { isAuthorized } = require('../../api/middlewares/auth/isAuthorized');
const {
  ownerRegister,
  ownerUpdateProfile,
  ownerChangePassword,
} = require('../../api/controllers/owner/ownerController');
const router = express.Router();

router.post('/register', ownerRegister);
router.post('/updateProfile', hasToken, isAuthorized, ownerUpdateProfile);
router.post(
  '/ownerPasswordChanged',
  hasToken,
  isAuthorized,
  ownerChangePassword,
);

module.exports = router;
