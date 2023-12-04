const express = require('express');
const { registerUser } = require('../../api/controllers/user/userController');
const router = express.Router();

router.post('/register', registerUser);

module.exports = router;
