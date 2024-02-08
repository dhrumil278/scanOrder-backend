const { Events, uuidv4, query } = require('../../../config/constants');
const { orderValidation } = require('../../../config/validation');

const ownerOrderAccept = async (req, res) => {
  console.log('orderCreate called ...');
  try {
    let { orderId, shopId } = req.body;

    // get the userId from token
    let ownerId = req.userId;

    // validate Data
    let validationResult = await orderValidation({
      orderId: orderId,
      shopId: shopId,
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

    // accept the order
    let orderAccept = await query(
      'update pgorder set "isAccepted"=true, "updatedAt"=$1 where "id" = $2 and "shopId" = $3 returning *',
      [orderId, shopId, moment.utc().valueOf()],
    );

    if (orderAccept.rowCount > 0) {
      return res.status(200).json({
        message: 'Order Added!',
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

const ownerOrderReject = async (req, res) => {
  console.log('ownerOrderReject called ...');
  try {
    let { orderId, shopId, reason } = req.body;

    // get the userId from token
    let ownerId = req.userId;

    // validate Data
    let validationResult = await orderValidation({
      orderId: orderId,
      ownerId: ownerId,
      reason: reason,
      eventCode: Events.OWNER_ORDER_REJECT,
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
      [ownerId],
    );

    if (findShop.rowCount < 1) {
      return res.status(400).json({
        message: 'Shop Not Found!',
      });
    }

    // accept the order
    let orderReject = await query(
      'update pgorder set "isAccepted"=false, "updatedAt"=$1, "reason"=$2 where "id" = $3 and "shopId"= $4 returning *',
      [moment.utc().valueOf(), reason, orderId, ownerId],
    );

    if (orderReject.rowCount > 0) {
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

module.exports = {
  ownerOrderAccept,
  ownerOrderReject,
};
