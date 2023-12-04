const {
  query,
  bcrypt,
  Events,
  moment,
  templatesType,
} = require('../../../config/constants');
const { userAuthValidation } = require('../../../config/validation');
const { generateToken } = require('../../helpers/jwt/create');
const {
  emailDataValidation,
} = require('../../helpers/mail/emailDataValidation');
const { sendMail } = require('../../helpers/mail/sendMail');

const login = async (req, res) => {
  console.log('login called...');
  try {
    let { email, password } = req.body;

    // validate Data
    let validationResult = await userAuthValidation({
      email: email,
      password: password,
      eventCode: Events.LOGIN,
    });

    // return the error on validation failed
    if (validationResult.hasError === true) {
      return res.status(400).json({
        message: 'Field Missing',
        data: {},
        error: validationResult.error,
      });
    }

    let findUser = await query(
      'select * from pguser where "email" = $1 and "isDeleted" =false and "isVerified" =true and "isActive" =true ',
      [email],
    );

    // return the error on user not found
    if (findUser.rowCount < 1) {
      return res.status(400).json({
        message: 'Email Not Found!',
      });
    }

    let compare = await bcrypt.compare(password, findUser.rows[0].password);

    // return the errro on password incorrect
    if (compare === false) {
      return res.status(400).json({
        message: 'Incorrect Password!',
      });
    }

    // prepared the object for generate the token
    let payload = {
      id: findUser.rows[0].id,
      secretKey: process.env.JWT_SECRET_KEY,
      expiresIn: '3d',
    };

    // function for generate the token
    const token = await generateToken(payload);

    // save token in DB
    const updateUser = await query(
      'update pguser set "accessToken" = $1, "updatedAt"=$2 where "id" = $3',
      [token.data, parseInt(moment.utc().valueOf()), findUser.rows[0].id],
    );

    // return the success response
    return res.status(200).json({
      message: 'Login Success!',
      data: {
        token: token.data,
      },
    });
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Something Went Wrong',
      data: {},
      error: error,
    });
  }
};

const emailVerification = async (req, res) => {
  console.log('Email Verification called...');
  try {
    // get the data from the req body
    let { token } = req.body;

    // get the userId from the middleware
    let userId = req.userId;

    // validate Data
    const validationResult = await userAuthValidation({
      token: token,
      eventCode: Events.EMAIL_VERIFY,
    });

    // return the error on validation failed
    if (validationResult.hasError == true) {
      return res.status(400).json({
        message: 'Field Missing',
        error: validationResult.error,
      });
    }

    let findUser = await query(
      'select * from pguser where "id" = $1 and "isDeleted" =false and "isVerified" =false and "isActive" =true',
      [userId],
    );

    // compare token
    if (findUser.rowCount < 1 || findUser.rows[0].accessToken !== token) {
      return res.status(400).json({
        message: 'Invalid Token!',
      });
    }

    // prepared the payload to sign new token
    let payload = {
      id: userId,
      secretKey: process.env.JWT_SECRET_KEY,
      expiresIn: '3d',
    };

    // call function for generate the token
    let newToken = await generateToken(payload);

    // update the new token and isVerified status in the db
    const updateUser = await query(
      'update pguser set "accessToken" = $1,"updatedAt"=$2,"isVerified"=$3 where "id" = $4',
      [newToken.data, moment.utc().valueOf(), true, userId],
    );

    // return the success token
    return res.status(200).json({
      message: 'Email Verified!',
      data: {
        token: newToken.data,
      },
    });
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Something Went Wrong',
      data: {},
      error: error,
    });
  }
};

const forgotPassword = async (req, res) => {
  console.log('forgotPassword called....');
  try {
    const { email } = req.body;
    // validate Data
    const validationResult = await userAuthValidation({
      email: email,
      eventCode: Events.FORGOT_PASSWORD,
    });

    // return the error on validation failed
    if (validationResult.hasError == true) {
      return res.status(400).json({
        message: 'Field Missing',
        error: validationResult.error,
      });
    }

    // find the active user in DB
    const findUser = await query(
      'select * from pguser where "email"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [email],
    );

    if (findUser.rowCount < 1) {
      return res.status(400).json({
        message: 'Email Not Found!',
      });
    }

    // prepared the payload to sign new token
    const payload = {
      id: findUser.rows[0].id,
      secretKey: process.env.JWT_SECRET_KEY,
      expiresIn: '3d',
    };

    // call function for generate the token
    const token = await generateToken(payload);

    // update the new token and isVerified status in the db
    const updateUser = await query(
      'update pguser set "accessToken" = $1,"updatedAt"=$2 where "id" = $3',
      [token.data, moment.utc().valueOf(), findUser.rows[0].id],
    );

    const link = `${process.env.REDIRECT_LINK}/forgotPasswordConfirmation?token=${token.data}`;

    const mailTemplateData = {
      mailData: {
        from: process.env.COMPANY_EMAIL,
        to: email,
        subject: 'Welcome to ScanOrder | Verify your Email',
        cc: '',
      },
      templateData: {
        link: link,
      },
      eventCode: templatesType.FORGOT_PASS_VERIFICATION,
    };

    const template = await emailDataValidation(mailTemplateData);

    mailTemplateData.mailData['html'] = template.data;

    const mailresult = await sendMail(mailTemplateData.mailData);

    if (mailresult.hasError == true) {
      return res.status(400).json({
        message: 'Mail Not Send!',
        error: mailresult.error,
      });
    } else {
      const { password, ...other } = findUser.rows[0];
      return res.status(200).json({
        data: other,
        message: 'Verification Email Send!',
      });
    }
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Something Went Wrong',
      data: {},
      error: error,
    });
  }
};

const verifyForgotEmail = async (req, res) => {
  console.log('verifyForgotEmail called...');
  try {
    // get the data from the req body
    const { token } = req.body;

    // get the userId from the middleware
    const userId = req.userId;

    // validate Data
    const validationResult = await userAuthValidation({
      token: token,
      eventCode: Events.VERIFY_FORGOT_EMAIL,
    });

    // return the error on validation failed
    if (validationResult.hasError == true) {
      return res.status(400).json({
        message: 'Field Missing',
        error: validationResult.error,
      });
    }

    // find the active user in DB
    const findUser = await query(
      'select * from pguser where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [userId],
    );

    // compare token
    if (findUser.rowCount < 1 || findUser.rows[0].accessToken !== token) {
      return res.status(400).json({
        message: 'Invalid Token',
      });
    }

    // prepared the payload to sign new token
    const payload = {
      id: userId,
      secretKey: process.env.JWT_SECRET_KEY,
      expiresIn: '3d',
    };

    // call function for generate the token
    const newToken = await generateToken(payload);

    // update the new token and isVerified status in the db
    const updateUser = await query(
      'update pguser set "accessToken" = $1,"updatedAt"=$2 where "id" = $3',
      [newToken.data, moment.utc().valueOf(), userId],
    );

    // return the success token
    return res.status(200).json({
      message: 'Forgot Password Email Verified!',
      data: {
        token: newToken.data,
      },
    });
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Something Went Wrong',
      data: {},
      error: error,
    });
  }
};

const changeForgotPassword = async (req, res) => {
  console.log('changePassword called...');
  try {
    // get the data from the req body
    let { password } = req.body;

    // get the userId from the middleware
    const userId = req.userId;

    // validate Data
    const validationResult = await userAuthValidation({
      password: password,
      eventCode: Events.CHANGE_FORGOT_PASSWORD,
    });

    // return the error on validation failed
    if (validationResult.hasError == true) {
      return res.status(400).json({
        message: 'Field Missing',
        error: validationResult.error,
      });
    }

    // find the active user in DB
    const findUser = await query(
      'select * from pguser where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [userId],
    );

    if (findUser.rowCount < 1) {
      return res.status(400).json({
        message: 'User Not Found!',
      });
    }

    // Generate the Hash Password
    const hash = await bcrypt.hash(password, 10);

    // Sign the Token
    const payload = {
      id: userId,
      secretKey: process.env.JWT_SECRET_KEY,
      expiresIn: '3d',
    };

    // call generate token function
    const token = await generateToken(payload);

    const updateUser = await query(
      'update pguser set "accessToken" = $1,"updatedAt"=$2,"password"=$3 where "id" = $4',
      [token.data, moment.utc().valueOf(), hash, userId],
    );

    return res.status(200).json({
      message: 'Password Changed',
      data: findUser.rows[0],
    });
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Something Went Wrong',
      data: {},
      error: error,
    });
  }
};
module.exports = {
  login,
  emailVerification,
  forgotPassword,
  verifyForgotEmail,
  changeForgotPassword,
};
