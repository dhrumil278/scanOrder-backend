const { Events, Validator } = require('./constants');

const userValidation = (reqData) => {
  console.log('userValidation called...');
  try {
    let data;
    let rules;

    switch (reqData.eventCode) {
      case Events.REGISTER:
        data = {
          email: reqData.email,
          password: reqData.password,
          username: reqData.username,
        };
        rules = {
          email: 'string|required',
          password: 'string|required',
          username: 'string|required',
        };
        break;

      case Events.LOGIN:
        data = {
          email: reqData.email,
          password: reqData.password,
        };
        rules = {
          email: 'string|required',
          password: 'string|required',
        };
        break;

      default:
        // nothing to do with default
        break;
    }
    const validate = new Validator(data, rules);
    let result = {};

    if (validate.passes()) {
      console.log('valiation success');
      result['hasError'] = false;
    }
    if (validate.fails()) {
      console.log('validation fails');
      result['hasError'] = true;
      result['error'] = validate.errors.all();
    }

    return result;
  } catch (error) {
    console.log('error: ', error);
    return {
      hasError: true,
      error: error,
    };
  }
};

const userAuthValidation = (reqData) => {
  console.log('userAuthValidation called...');
  try {
    let data;
    let rules;

    switch (reqData.eventCode) {
      case Events.LOGIN:
        data = {
          email: reqData.email,
          password: reqData.password,
        };
        rules = {
          email: 'string|required',
          password: 'string|required',
        };
        break;

      case Events.EMAIL_VERIFY:
        data = {
          token: reqData.token,
        };
        rules = {
          token: 'string|required',
        };
        break;

      case Events.FORGOT_PASSWORD:
        data = {
          email: reqData.email,
        };
        rules = {
          email: 'string|required',
        };
        break;

      case Events.VERIFY_FORGOT_EMAIL:
        data = {
          token: reqData.token,
        };
        rules = {
          token: 'string|required',
        };
        break;

      case Events.VERIFY_FORGOT_EMAIL:
        data = {
          password: reqData.password,
        };
        rules = {
          password: 'string|required',
        };
        break;

      default:
        // nothing to do with default
        break;
    }
    const validate = new Validator(data, rules);
    let result = {};

    if (validate.passes()) {
      console.log('valiation success');
      result['hasError'] = false;
    }
    if (validate.fails()) {
      console.log('validation fails');
      result['hasError'] = true;
      result['error'] = validate.errors.all();
    }

    return result;
  } catch (error) {
    console.log('error: ', error);
    return {
      hasError: true,
      error: error,
    };
  }
};

module.exports = {
  userValidation,
  userAuthValidation,
};
