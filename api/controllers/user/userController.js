const {
  Events,
  query,
  uuidv4,
  bcrypt,
  templatesType,
  moment,
} = require('../../../config/constants');
const { userValidation } = require('../../../config/validation');
const { generateToken } = require('../../helpers/jwt/create');
const {
  emailDataValidation,
} = require('../../helpers/mail/emailDataValidation');
const { sendMail } = require('../../helpers/mail/sendMail');

const registerUser = async (req, res) => {
  console.log('Register User Called...');
  try {
    const { email, password, username } = req.body;

    const reqData = {
      email: email,
      password: password,
      username: username,
    };

    // validate Data
    const validationResult = await userValidation({
      ...reqData,
      eventCode: Events.REGISTER,
    });

    if (validationResult.hasError === true) {
      return res.status(400).json({
        message: 'Field Missing',
        error: validationResult.error,
      });
    }

    // Check is this a New User or Not
    const findUser = await query(
      `select * from pguser as u where ("email"=$1 or "username"=$2) and "isVerified"=$3`,
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
      'insert into pguser ("id","username","email","password","createdAt","updatedAt") values($1,$2,$3,$4,$5,$6) returning *';
    let values = [
      uuidv4(),
      username,
      email,
      hash,
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
      'update pguser set "accessToken" = $1,"updatedAt"=$2 where id = $3',
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

    const mailresult = await sendMail(mailTemplateData.mailData);

    if (mailresult.hasError == true) {
      return res.status(400).json({
        message: 'Mail Not Send!',
        error: mailresult.error,
      });
    } else {
      const { password, ...other } = userResult.rows[0];
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

module.exports = {
  registerUser,
};
