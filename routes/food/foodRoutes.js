const express = require('express');
const {
  addFoodItem,
  updateFood,
  deleteFood,
  getAllFood,
  getOneFood,
  getAllCategory,
  getFoodByCategory,
  bookmarkFood,
  getBookmarkFood,
  addToCartFood,
} = require('../../api/controllers/food/foodController');
const { upload } = require('../../api/middlewares/food/uploadFoodImage');
const { hasToken } = require('../../api/middlewares/auth/hasToken');
const { isAuthorized } = require('../../api/middlewares/auth/isAuthorized');
const router = express.Router();

router.post('/addFoodItem', hasToken, isAuthorized, upload, addFoodItem);
router.post('/updateFood', hasToken, isAuthorized, updateFood);
router.post('/deleteFood', hasToken, isAuthorized, deleteFood);
router.get('/getAllFood', hasToken, isAuthorized, getAllFood);
router.get('/getOneFood/:foodId/:shopId', hasToken, isAuthorized, getOneFood);
router.get('/getFoodByCategory', hasToken, isAuthorized, getFoodByCategory);
router.post('/getAllCategory', hasToken, isAuthorized, getAllCategory);
router.post('/bookmark', hasToken, isAuthorized, bookmarkFood);
router.get('/bookmarkFood', hasToken, isAuthorized, getBookmarkFood);
router.post('/addFoodInCart', hasToken, isAuthorized, addToCartFood);

module.exports = router;
