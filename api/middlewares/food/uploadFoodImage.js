const { multer, moment } = require('../../../config/constants');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `${process.env.PWD}/upload/`);
  },
  filename: function (req, file, cb) {
    cb(null, `${moment.utc().valueOf()}` + '-' + file.originalname);
  },
});

const fileFilter = function (req, file, cb) {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/jpg'
  ) {
    console.log('fileFilter pass');
    cb(null, true);
  } else {
    console.log('fileFilter fail');
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
}).array('files', 5);

module.exports = {
  upload,
};
