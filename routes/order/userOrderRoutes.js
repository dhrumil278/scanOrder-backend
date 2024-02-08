const express = require('express');
const { hasToken } = require('../../api/middlewares/auth/hasToken');
const { isAuthorized } = require('../../api/middlewares/auth/isAuthorized');
const {
  orderCreate,
  userOrderConfirm,
  userOrderCancelled,
  orderAcceptByTimeOut,
} = require('../../api/controllers/order/userOrderController');

const router = express.Router();

router.post('/orderCreate', hasToken, isAuthorized, orderCreate);
router.post('/userOrderConfirm', hasToken, isAuthorized, userOrderConfirm);
router.post('/userOrderCancelled', hasToken, isAuthorized, userOrderCancelled);
router.post(
  '/orderAcceptByTimeOut',
  hasToken,
  isAuthorized,
  orderAcceptByTimeOut,
);

module.exports = router;
