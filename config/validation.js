const { Events, Validator } = require('./constants');

const userValidation = (reqData) => {
  console.log('userValidation called...');
  try {
    let data;
    let rules;

    switch (reqData.eventCode) {
      case Events.REGISTER_OWNER:
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
      case Events.REGISTER_OWNER:
        data = {
          email: reqData.email,
          password: reqData.password,
          username: reqData.username,
          shopname: reqData.shopname,
        };
        rules = {
          email: 'string|required',
          password: 'string|required',
          username: 'string|required',
          shopname: 'string|required',
        };
        break;
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

      case Events.UPDATE_PROFILE:
        data = {
          firstname: reqData.firstname,
          lastname: reqData.lastname,
          phone: reqData.phone,
          address: reqData.address,
          city: reqData.city,
          state: reqData.state,
          country: reqData.country,
          zipcode: reqData.zipcode,
        };
        rules = {
          firstname: 'string|required',
          lastname: 'string|required',
          phone: 'numeric|required',
          address: 'string|required',
          city: 'string|required',
          state: 'string|required',
          country: 'string|required',
          zipcode: 'string|numeric',
        };
        break;

      case Events.USER_CHANGE_PASSWORD:
        data = {
          password: reqData.password,
          newPassword: reqData.newPassword,
        };
        rules = {
          password: 'string|required',
          newPassword: 'string|required',
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
          otp: reqData.otp,
        };
        rules = {
          token: 'string|required',
          otp: 'string|required',
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

const foodValidation = (reqData) => {
  console.log('food data Validation called...');
  try {
    let data;
    let rules;

    switch (reqData.eventCode) {
      case Events.ADD_FOOD_ITEM:
        data = {
          title: reqData.title,
          description: reqData.description,
          price: reqData.price,
          isVeg: reqData.isVeg,
          category: reqData.category,
        };
        rules = {
          title: 'string|required',
          description: 'string|required',
          price: 'numeric|required',
          isVeg: 'boolean|required',
          category: 'string|required',
        };
        break;

      case Events.UPDATE_FOOD:
        data = {
          title: reqData.title,
          description: reqData.description,
          price: reqData.price,
          isVeg: reqData.isVeg,
          category: reqData.category,
          foodId: reqData.foodId,
        };
        rules = {
          title: 'string|required',
          description: 'string|required',
          price: 'numeric|required',
          isVeg: 'boolean|required',
          category: 'string|required',
          foodId: 'string|required',
        };
        break;

      case Events.DELETE_FOOD:
        data = {
          foodId: reqData.foodId,
        };
        rules = {
          foodId: 'string|required',
        };
        break;

      case Events.GET_ONE_FOOD:
        data = {
          foodId: reqData.foodId,
        };
        rules = {
          foodId: 'string|required',
        };
        break;

      case Events.GET_FOOD_BY_CATEGORY:
        data = {
          category: reqData.category,
          shopId: reqData.shopId,
        };
        rules = {
          category: 'string|required',
          shopId: 'string|required',
        };
        break;

      case Events.BOOKMARK_FOOD:
        data = {
          foodId: reqData.foodId,
        };
        rules = {
          foodId: 'string|required',
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

const orderValidation = (reqData) => {
  console.log('food data Validation called...');
  try {
    let data;
    let rules;

    switch (reqData.eventCode) {
      case Events.ADD_FOOD_ITEM:
        data = {
          title: reqData.title,
          description: reqData.description,
          price: reqData.price,
          isVeg: reqData.isVeg,
          category: reqData.category,
        };
        rules = {
          title: 'string|required',
          description: 'string|required',
          price: 'numeric|required',
          isVeg: 'boolean|required',
          category: 'string|required',
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
  foodValidation,
  orderValidation,
};
