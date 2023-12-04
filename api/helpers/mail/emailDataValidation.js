const {
  templatesType,
  ejs,
  path,
  Validator,
} = require('../../../config/constants');

const emailDataValidation = async (reqData) => {
  console.log('emailDataValidation called...');
  try {
    let data;
    let rules;

    switch (reqData.eventCode) {
      case templatesType.VERIFICATION_EMAIL:
        data = {
          mailData: {
            from: reqData.mailData.from,
            to: reqData.mailData.to,
            subject: reqData.mailData.subject,
            cc: reqData.mailData.cc,
          },
          templateData: {
            link: reqData.templateData.link,
            template: 'verifyEmail.ejs',
          },
        };

        rules = {
          mailData: {
            from: 'string|required',
            to: 'string|required',
            subject: 'string|required',
            cc: 'string',
          },
          templateData: {
            link: 'string|required',
            template: 'string|required',
          },
        };
        break;

      case templatesType.FORGOT_PASS_VERIFICATION:
        data = {
          mailData: {
            from: reqData.mailData.from,
            to: reqData.mailData.to,
            subject: reqData.mailData.subject,
            cc: reqData.mailData.cc,
          },
          templateData: {
            link: reqData.templateData.link,
            template: 'forgotPassVerify.ejs',
          },
        };

        rules = {
          mailData: {
            from: 'string|required',
            to: 'string|required',
            subject: 'string|required',
            cc: 'string',
          },
          templateData: {
            link: 'string|required',
            template: 'string|required',
          },
        };
        break;

      default:
        // Nothing to do in default
        break;
    }
    const validate = new Validator(data, rules);

    if (validate.passes()) {
      console.log('valiation success for mail template');
      const html = await ejs.renderFile(
        path.join(
          process.env.PWD,
          'public/views/emailTemplates',
          data.templateData.template,
        ),
        reqData.templateData,
        { async: true },
      );
      return { data: html, hasError: false };
    }
    if (validate.fails()) {
      console.log('validation fails');
      return {
        hasError: true,
        error: validate.errors.all(),
      };
    }
  } catch (error) {
    console.log('error: ', error);
  }
};

module.exports = {
  emailDataValidation,
};
