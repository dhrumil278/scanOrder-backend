const { jwt } = require('../../../config/constants');

const isAuthorized = async (req, res, next) => {
  console.log('Is Authorized Called...');
  try {
    console.log('req.headers: ', req.headers);
    if (req.headers.authorization) {
      console.log('req.headers.authorization: ', req.headers.authorization);
      const token = req.headers.authorization.split(' ')[1];
      console.log('token: ', token);

      if (token && token !== null) {
        const decode = await jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.userId = decode.userId;
        return next();
      } else {
        return res.status(400).json({
          message: 'Token not Found',
        });
      }
    } else {
      return res.status(300).json({
        message: 'Forbidden!',
      });
    }
  } catch (error) {
    console.log('error: ', error);
    return res.status(300).json({
      message: 'Forbidden!',
    });
  }
};

module.exports = {
  isAuthorized,
};
