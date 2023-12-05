const express = require('express');
const {
  registerUser,
  updateProfile,
  userChangePassword,
} = require('../../api/controllers/user/userController');
const { hasToken } = require('../../api/middlewares/auth/hasToken');
const { isAuthorized } = require('../../api/middlewares/auth/isAuthorized');
const router = express.Router();

router.post('/register', registerUser);
router.post('/updateProfile', hasToken, isAuthorized, updateProfile);
router.post('/userPasswordChanged', hasToken, isAuthorized, userChangePassword);

module.exports = router;
