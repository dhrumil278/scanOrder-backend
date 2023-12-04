const { jwt } = require('../../../config/constants');

const generateToken = (data) => {
  console.log('generateToken called...');
  try {
    const token = jwt.sign({ userId: data.id }, data.secretKey, {
      expiresIn: data.expiresIn,
    });

    if (token) {
      return {
        hasError: false,
        data: token,
      };
    } else {
      return {
        hasError: true,
      };
    }
  } catch (error) {
    console.log('error: ', error);
    return {
      hasError: true,
      error: error,
    };
  }
};

module.exports = {
  generateToken,
};
