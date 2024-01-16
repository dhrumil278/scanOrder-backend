const hasToken = async (req, res, next) => {
  console.log('has Token Called...');
  try {
    console.log('req.headers: ', req.headers);
    if (
      req.headers.authorization &&
      req.headers.authorization.split(' ')[0] === 'Bearer'
    ) {
      return next();
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
  hasToken,
};
