let {
  query,
  bcrypt,
  Events,
  moment,
  templatesType,
} = require('../../../config/constants');
let { userAuthValidation } = require('../../../config/validation');
let { generateToken } = require('../../helpers/jwt/create');
let { emailDataValidation } = require('../../helpers/mail/emailDataValidation');
let { sendMail } = require('../../helpers/mail/sendMail');

let login = async (req, res) => {
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
      expiresIn: '30d',
    };

    // function for generate the token
    let token = await generateToken(payload);

    // save token in DB
    let updateUser = await query(
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

let emailVerification = async (req, res) => {
  console.log('Email Verification called...');
  try {
    // get the data from the req body
    let { token, otp } = req.body;

    // get the userId from the middleware
    let userId = req.userId;
    console.log('userId: ', userId);

    // validate Data
    let validationResult = await userAuthValidation({
      token: token,
      otp: otp,
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
      'select * from pguser where "id" = $1 and "otp" = $2 and "isDeleted" =false and "isVerified" =false and "isActive" =true',
      [userId, otp],
    );

    // compare token
    if (findUser.rowCount < 1 || findUser.rows[0].accessToken !== token) {
      return res.status(400).json({
        message: 'Invalid OTP!',
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
    let updateUser = await query(
      'update pguser set "accessToken" = $1,"updatedAt"=$2,"isVerified"=$3 where "id" = $4 returning *',
      [newToken.data, moment.utc().valueOf(), true, userId],
    );
    let { password, ...other } = updateUser.rows[0];
    // return the success token
    return res.status(200).json({
      message: 'Email Verified!',
      data: other,
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

let forgotPassword = async (req, res) => {
  console.log('forgotPassword called....');
  try {
    let { email } = req.body;
    // validate Data
    let validationResult = await userAuthValidation({
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
    let findUser = await query(
      'select * from pguser where "email"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [email],
    );

    if (findUser.rowCount < 1) {
      return res.status(400).json({
        message: 'Email Not Found!',
      });
    }

    // prepared the payload to sign new token
    let payload = {
      id: findUser.rows[0].id,
      secretKey: process.env.JWT_SECRET_KEY,
      expiresIn: '3d',
    };

    // call function for generate the token
    let token = await generateToken(payload);

    let otp = Math.floor(Math.random() * 90000) + 100000;
    console.log('otp: ', otp);

    // update the new token and isVerified status in the db
    let updateUser = await query(
      'update pguser set "accessToken" = $1, "otp"=$2, "updatedAt"=$3 where "id" = $4 returning *',
      [token.data, otp, moment.utc().valueOf(), findUser.rows[0].id],
    );

    // let link = `${process.env.REDIRECT_LINK}/forgotPasswordConfirmation?token=${token.data}`;

    let mailTemplateData = {
      mailData: {
        from: process.env.COMPANY_EMAIL,
        to: email,
        subject: 'Welcome to ScanOrder | Verify your Email',
        cc: '',
      },
      templateData: {
        otp: otp,
      },
      eventCode: templatesType.FORGOT_PASS_VERIFICATION,
    };

    let template = await emailDataValidation(mailTemplateData);

    mailTemplateData.mailData['html'] = template.data;

    let mailresult = await sendMail(mailTemplateData.mailData);

    if (mailresult.hasError == true) {
      return res.status(400).json({
        message: 'Mail Not Send!',
        error: mailresult.error,
      });
    } else {
      let { password, ...other } = updateUser.rows[0];
      return res.status(200).json({
        message: 'Verification Email Send!',
        data: other,
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

let verifyForgotEmail = async (req, res) => {
  console.log('verifyForgotEmail called...');
  try {
    // get the data from the req body
    let { token, otp } = req.body;

    // get the userId from the middleware
    let userId = req.userId;

    // validate Data
    let validationResult = await userAuthValidation({
      token: token,
      otp: otp,
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
    let findUser = await query(
      'select * from pguser where "id"=$1 and "otp"=$2 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [userId, otp],
    );

    // compare token
    if (findUser.rowCount < 1 || findUser.rows[0].accessToken !== token) {
      return res.status(400).json({
        message: 'Invalid OTP',
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
    let updateUser = await query(
      'update pguser set "accessToken" = $1,"updatedAt"=$2 where "id" = $3 returning *',
      [newToken.data, moment.utc().valueOf(), userId],
    );

    let { password, ...other } = updateUser.rows[0];
    // return the success token
    return res.status(200).json({
      message: 'Forgot Password Email Verified!',
      data: other,
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

let changeForgotPassword = async (req, res) => {
  console.log('changePassword called...');
  try {
    // get the data from the req body
    let { password } = req.body;

    // get the userId from the middleware
    let userId = req.userId;

    // validate Data
    let validationResult = await userAuthValidation({
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
    let findUser = await query(
      'select * from pguser where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [userId],
    );

    if (findUser.rowCount < 1) {
      return res.status(400).json({
        message: 'User Not Found!',
      });
    }

    // Generate the Hash Password
    let hash = await bcrypt.hash(password, 10);

    // Sign the Token
    let payload = {
      id: userId,
      secretKey: process.env.JWT_SECRET_KEY,
      expiresIn: '3d',
    };

    // call generate token function
    let token = await generateToken(payload);

    let updateUser = await query(
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
