let {
  Events,
  query,
  uuidv4,
  bcrypt,
  templatesType,
  moment,
} = require('../../../config/constants');
let { userValidation } = require('../../../config/validation');
let { generateToken } = require('../../helpers/jwt/create');
let { emailDataValidation } = require('../../helpers/mail/emailDataValidation');
let { sendMail } = require('../../helpers/mail/sendMail');

let ownerRegister = async (req, res) => {
  console.log('Register Owner Called...');
  try {
    let { email, password, username, shopname } = req.body;

    let reqData = {
      email: email,
      password: password,
      username: username,
      shopname: shopname,
    };

    // validate Data
    let validationResult = await userValidation({
      ...reqData,
      eventCode: Events.REGISTER_OWNER,
    });

    if (validationResult.hasError === true) {
      return res.status(400).json({
        message: 'Field Missing',
        error: validationResult.error,
      });
    }

    // Check is this a New User or Not
    let findUser = await query(
      `select * from pgowner as u where ("email"=$1 or "username"=$2) and "isVerified"=$3`,
      [email, username, true],
    );

    if (findUser.rowCount > 0) {
      return res.status(400).json({
        message: 'Email or Username in Use!',
      });
    }

    // Generate the Hash Password
    let hash = await bcrypt.hash(password, 10);

    let queryString =
      'insert into pgowner ("id","username","email","password","shopname","createdAt","updatedAt") values($1,$2,$3,$4,$5,$6,$7) returning *';
    let values = [
      uuidv4(),
      username,
      email,
      hash,
      shopname,
      parseInt(moment.utc().valueOf()),
      parseInt(moment.utc().valueOf()),
    ];

    let userResult = await query(queryString, values);

    // Sign the Token
    let payload = {
      id: userResult.rows[0].id,
      secretKey: process.env.JWT_SECRET_KEY,
      expiresIn: '3d',
    };

    let token = await generateToken(payload);

    // save token in DB
    let updateUser = await query(
      'update pgowner set "accessToken" = $1,"updatedAt"=$2 where id = $3',
      [token.data, moment.utc().valueOf(), userResult.rows[0].id],
    );

    let link = `${process.env.REDIRECT_LINK}/emailverification?token=${token.data}`;

    let mailTemplateData = {
      mailData: {
        from: process.env.COMPANY_EMAIL,
        to: email,
        subject: 'Welcome to ScanOrder | Verify your Email',
        cc: '',
      },
      templateData: {
        link: link,
      },
      eventCode: templatesType.VERIFICATION_EMAIL,
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
      let { password, ...other } = userResult.rows[0];
      return res.status(200).json({
        data: other,
        message: 'Verification Email Send!',
      });
    }
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Somethig Went Wrong!',
      error: error,
    });
  }
};

let ownerUpdateProfile = async (req, res) => {
  console.log('Owner updateProfile called..');
  try {
    let { firstname, lastname, phone, address, city, state, country, zipcode } =
      req.body;

    // get the userId from the middleware
    let userId = req.userId;

    // validate Data
    let validationResult = await userValidation({
      // ...reqData,
      firstname: firstname,
      lastname: lastname,
      phone: phone,
      address: address,
      city: city,
      state: state,
      country: country,
      zipcode: zipcode,
      eventCode: Events.UPDATE_PROFILE,
    });

    if (validationResult.hasError === true) {
      return res.status(400).json({
        message: 'Field Missing',
        error: validationResult.error,
      });
    }

    // conver the data into lower case
    firstname = firstname.toLowerCase();
    lastname = lastname.toLowerCase();
    phone = phone;
    address = address.toLowerCase();
    city = city.toLowerCase();
    state = state.toLowerCase();
    country = country.toLowerCase();
    zipcode = zipcode;

    // find the active user in DB
    let findUser = await query(
      'select * from pgowner where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [userId],
    );

    if (findUser.rowCount < 1) {
      return res.status(400).json({
        message: 'User Not Found!',
      });
    }

    // save token in DB
    let updateUser = await query(
      'update pgowner set "firstname" = $1,"lastname"=$2, "phone"=$3,"address"=$4,"city"=$5,"state"=$6,"country"=$7,"zipcode"=$8,"updatedAt"=$9 where id = $10 returning *',
      [
        firstname,
        lastname,
        phone,
        address,
        city,
        state,
        country,
        zipcode,
        moment.utc().valueOf(),
        userId,
      ],
    );

    let { password, accessToken, ...other } = updateUser.rows[0];
    return res.status(200).json({
      message: 'Profile Updated!',
      data: other,
    });
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Somethig Went Wrong!',
      error: error,
    });
  }
};

const ownerChangePassword = async (req, res) => {
  console.log('Owner ChangePassword called...');
  try {
    const { password, newPassword } = req.body;

    // get the userId from the middleware
    let userId = req.userId;

    // validate Data
    let validationResult = await userValidation({
      // ...reqData,
      password: password,
      newPassword: newPassword,
      eventCode: Events.USER_CHANGE_PASSWORD,
    });

    if (validationResult.hasError === true) {
      return res.status(400).json({
        message: 'Field Missing',
        error: validationResult.error,
      });
    }

    // find the active user in DB
    let findUser = await query(
      'select * from pgowner where "id"=$1 and "isActive"=true and "isDeleted"=false and "isVerified"=true',
      [userId],
    );

    if (findUser.rowCount < 1) {
      return res.status(400).json({
        message: 'User Not Found!',
      });
    }

    let compare = await bcrypt.compare(password, findUser.rows[0].password);

    if (compare === false) {
      return res.status(400).json({
        message: 'Invalid Current Password!',
      });
    }

    let newHash = await bcrypt.hash(newPassword, 10);

    // save token in DB
    let updateUser = await query(
      'update pgowner set "password" = $1, "updatedAt"=$2 where id = $3',
      [newHash, moment.utc().valueOf(), userId],
    );

    return res.status(200).json({
      message: 'Password Changed!',
    });
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({
      message: 'Somethig Went Wrong!',
      error: error,
    });
  }
};

module.exports = {
  ownerRegister,
  ownerUpdateProfile,
  ownerChangePassword,
};
