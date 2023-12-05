const express = require('express');
const {
  addFoodItem,
  updateFood,
  deleteFood,
  getAllFood,
  getOneFood,
} = require('../../api/controllers/food/foodController');
const { upload } = require('../../api/middlewares/food/uploadFoodImage');
const { hasToken } = require('../../api/middlewares/auth/hasToken');
const { isAuthorized } = require('../../api/middlewares/auth/isAuthorized');
const router = express.Router();

router.post('/addFoodItem', hasToken, isAuthorized, upload, addFoodItem);
router.post('/updateFood', hasToken, isAuthorized, updateFood);
router.post('/deleteFood', hasToken, isAuthorized, deleteFood);
router.get('/getAllFood', hasToken, isAuthorized, getAllFood);
router.get('/getOneFood', hasToken, isAuthorized, getOneFood);

module.exports = router;
