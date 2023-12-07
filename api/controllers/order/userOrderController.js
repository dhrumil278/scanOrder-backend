const { Events } = require('../../../config/constants');

const orderCreate = async (req, res) => {
  console.log('orderCreate called ...');
  try {
    let { foodId, shopId, quantity, price } = req.body;

    // get the userId from token
    let userId = req.userId;

    // validate Data
    let validationResult = await foodValidation({
      foodId: foodId,
      shopId: shopId,
      quantity: quantity,
      price: price,
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
  } catch (error) {
    console.log('error: ', error);
  }
};
