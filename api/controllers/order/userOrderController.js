const {
  Events,
  uuidv4,
  query,
  fs,
  moment,
} = require('../../../config/constants');
const {
  orderValidation,
  foodValidation,
} = require('../../../config/validation');
const { use } = require('../../../routes/food/foodRoutes');

const orderCreate = async (req, res) => {
  console.log('orderCreate called ...');
  try {
    let { foodIds, shopId } = req.body;

    // get the userId from token
    let userId = req.userId;

    // validate Data
    let validationResult = await orderValidation({
      foodIds: foodIds,
      shopId: shopId,
      eventCode: Events.ORDER_CREATE,
    });

    if (validationResult.hasError === true) {
      return res.status(400).json({
        message: 'Field Missing',
        error: validationResult.error,
      });
    }

    // find the active user in DB
    let findUser = await query(
      'select * from pguser where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [userId],
    );

    // find the active user in DB
    let findShop = await query(
      'select * from pgowner where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [shopId],
    );

    if (findShop.rowCount < 1 && findUser.rowCount < 1) {
      return res.status(400).json({
        message: 'Shop or User Not Found!',
      });
    }

    let orderId = uuidv4();
    let orderData = [];

    let getFood = await query(
      'select a.*, b."quantity" from (select * from pgfood where "id" = any($1)) as a left join (select * from pgaddtocart where "quantity" > 0 and "shopId" = $2 and "userId" = $3) as b on a."id" = b."foodId"',
      [foodIds, shopId, userId],
    );

    // console.log('getFood: ', getFood.rows);
    if (getFood.rowCount < 1) {
      return res.status(400).json({
        message: 'Order not Created',
      });
    }
    console.log('getFood.rowCount: ', getFood.rowCount);

    for (let i = 0; i < getFood.rows.length; i++) {
      console.log('getFood[i]: ', getFood[i]);
      let addOrder = await query(
        'insert into pgorder ("id","orderId","userId","shopId","foodId","quantity","price","createdAt","updatedAt") values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *',
        [
          uuidv4(),
          orderId,
          userId,
          shopId,
          getFood.rows[i].id,
          getFood.rows[i].quantity || 1,
          (getFood.rows[i].quantity || 1) * getFood.rows[i].price,
          moment.utc().valueOf(),
          moment.utc().valueOf(),
        ],
      );
      console.log('addOrder.rows: ', addOrder.rows);
      console.log('addOrder.rows: ', addOrder.rowCount);
      if (addOrder.rowCount < 0) {
        break;
      } else {
        orderData.push(addOrder.rows[0]);
      }
    }

    if (orderData.length < 1) {
      console.log('last condition');
      return res.status(400).json({
        message: 'Order not Created',
      });
    } else {
      return res.status(200).json({
        message: 'Order Added!',
        data: { orderId: orderData[0].orderId, getFood: getFood.rows },
      });
    }
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error,
    });
  }
};

const userOrderConfirm = async (req, res) => {
  console.log('userOrderConfirm called ...');
  try {
    let { orderId } = req.body;

    // get the userId from token
    let userId = req.userId;

    // validate Data
    let validationResult = await orderValidation({
      orderId: orderId,
      eventCode: Events.USER_ORDER_CONFIRM,
    });

    if (validationResult.hasError === true) {
      return res.status(400).json({
        message: 'Field Missing',
        error: validationResult.error,
      });
    }

    // // find the active user in DB
    // let findShop = await query(
    //   'select * from pgowner where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
    //   [shopId],
    // );

    let findUser = await query(
      'select * from pguser where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [userId],
    );

    if (findUser.rowCount < 1) {
      return res.status(400).json({
        message: 'Shop or User Not Found!',
      });
    }

    let findOrder = await query(
      'select * from pgorder where "orderId"=$1 and "isConfirmed"=false and "isAccepted"=false and "isCancelled"=false and "isCompleted"=false',
      [orderId],
    );

    if (findOrder.rowCount > 0) {
      // confirm the order
      let orderconfirmed = await query(
        'update pgorder set "isConfirmed"=true, "updatedAt"=$1 where "orderId" = $2 returning *',
        [moment.utc().valueOf(), orderId],
      );

      if (orderconfirmed.rowCount > 0) {
        return res.status(200).json({
          message: 'Order Confirmed!',
        });
      }
    } else {
      return res.status(400).json({
        message: 'Order Note Found!',
      });
    }
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error,
    });
  }
};

const userOrderCancelled = async (req, res) => {
  console.log('ownerOrderReject called ...');
  try {
    let { orderId, shopId, reason } = req.body;

    // get the userId from token
    let userId = req.userId;

    // validate Data
    let validationResult = await orderValidation({
      orderId: orderId,
      shopId: shopId,
      reason: reason,
      eventCode: Events.USER_ORDER_CANCEL,
    });

    if (validationResult.hasError === true) {
      return res.status(400).json({
        message: 'Field Missing',
        error: validationResult.error,
      });
    }

    // find the active user in DB
    let findShop = await query(
      'select * from pgowner where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [shopId],
    );

    let findUser = await query(
      'select * from pguser where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [userId],
    );

    if (findShop.rowCount < 1 || findUser.rowCount < 1) {
      return res.status(400).json({
        message: 'Shop or User Not Found!',
      });
    }

    // accept the order
    let ordercancelled = await query(
      'update pgorder set "isCancelled"=true, "orderCancelledBy"=$1,"updatedAt"=$2, "reason"=$3 where "id" = $4 and "shopId"= $5 returning *',
      [moment.utc().valueOf(), reason, orderId, ownerId],
    );

    if (ordercancelled.rowCount > 0) {
      return res.status(200).json({
        message: 'Order Rejected!',
      });
    } else {
      return res.status(400).json({
        message: 'Order Note Rejected!',
      });
    }
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error,
    });
  }
};

const orderAcceptByTimeOut = async (req, res) => {
  console.log('orderCreate called ...');
  try {
    let { orderId } = req.body;

    // get the userId from token
    let userId = req.userId;

    // validate Data
    let validationResult = await orderValidation({
      orderId: orderId,
      eventCode: Events.ORDER_ACCEPT,
    });

    if (validationResult.hasError === true) {
      return res.status(400).json({
        message: 'Field Missing',
        error: validationResult.error,
      });
    }

    // find the active user in DB
    let findUser = await query(
      'select * from pguser where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [userId],
    );

    if (findUser.rowCount < 1) {
      return res.status(400).json({
        message: 'Shop or User Not Found!',
      });
    }

    let findOrder = await query(
      'select * from pgorder where "orderId"=$1 and "isConfirmed"=true and "isAccepted"=false and "isCancelled"=false and "isCompleted"=false',
      [orderId],
    );

    if (findOrder.rowCount < 0) {
      return res.status(400).json({
        message: 'Order Note Found!',
      });
    }
    // accept the order
    let orderAccept = await query(
      'update pgorder set "isAccepted"=true, "updatedAt"=$1 where "id" = $2 returning *',
      [moment.utc().valueOf(), orderId],
    );

    if (orderAccept.rowCount > 0) {
      return res.status(200).json({
        message: 'Order Accepted!',
      });
    } else {
      return res.status(400).json({
        message: 'Order Note Accepted!',
      });
    }
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error,
    });
  }
};

module.exports = {
  orderCreate,
  userOrderConfirm,
  userOrderCancelled,
  orderAcceptByTimeOut,
};
