const hasToken = async (req, res, next) => {
  console.log('has Token Called...');
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.split(' ')[0] === 'Bearer'
    ) {
      return next();
    } else {
      return res.status(300).json({
        message: 'Token not Found!',
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
  hasToken,
};
