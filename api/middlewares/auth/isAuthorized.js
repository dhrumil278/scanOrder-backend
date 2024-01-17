const { jwt } = require('../../../config/constants');

const isAuthorized = async (req, res, next) => {
  console.log('Is Authorized Called...');
  try {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];

      if (token && token !== null) {
        const decode = await jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.userId = decode.userId;
        return next();
      } else {
        return res.status(400).json({
          message: 'Token not Found!',
        });
      }
    } else {
      return res.status(300).json({
        message: 'Unauthorized User!',
      });
    }
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Internal Server Error!',
    });
  }
};

module.exports = {
  isAuthorized,
};
