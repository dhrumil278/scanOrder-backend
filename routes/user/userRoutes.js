const express = require('express');
const {
  registerUser,
  updateProfile,
  userChangePassword,
  getUserProfile,
  updateAvatar,
} = require('../../api/controllers/user/userController');
const { hasToken } = require('../../api/middlewares/auth/hasToken');
const { isAuthorized } = require('../../api/middlewares/auth/isAuthorized');
const { upload } = require('../../api/middlewares/food/uploadFoodImage');
const router = express.Router();

router.post('/register', registerUser);
router.post('/updateProfile', hasToken, isAuthorized, updateProfile);
router.post('/userPasswordChanged', hasToken, isAuthorized, userChangePassword);
router.get('/getUser', hasToken, isAuthorized, getUserProfile);
router.post('/updateAvatar', hasToken, isAuthorized, upload, updateAvatar);

module.exports = router;
