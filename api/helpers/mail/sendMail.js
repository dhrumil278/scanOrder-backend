const { transporter } = require('../../../config/constants');

const sendMail = async (data) => {
  console.log('sendMail called...');
  try {
    return new Promise((resolve, reject) => {
      let result = {};

      transporter.sendMail(data, (err, info) => {
        if (err) {
          console.log('err: ', err);
          result['hasError'] = true;
          resolve(result);
        } else {
          console.log('mail Send successFully');
          result['hasError'] = false;
          result['data'] = info.response;
          resolve(result);
        }
      });
    });
  } catch (error) {
    console.log('error: ', error);
    return {
      hasError: true,
      error: error,
    };
  }
};

module.exports = {
  sendMail,
};
