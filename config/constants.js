const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const Validator = require('validatorjs');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const ejs = require('ejs');
const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs');
const moment = require('moment');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

require('dotenv').config();

// whitelist urls
const whitelist = ['*'];

// cors options
const corsOptions = {
  origin: (origin, callback) => {
    if (origin) {
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error());
      }
    } else {
      callback(null, true);
    }
  },
};

// DB connection
const pool = new Pool({
  connectionString: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_DATABASE}`,
});

// query function
const query = (text, params) => pool.query(text, params);

// Config Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER_AUTH,
    pass: process.env.USER_PASS,
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// API Events
const Events = {
  REGISTER: 1,
  LOGIN: 2,
  EMAIL_VERIFY: 3,
  FORGOT_PASSWORD: 4,
  VERIFY_FORGOT_EMAIL: 5,
  CHANGE_FORGOT_PASSWORD: 6,
  UPDATE_PROFILE: 7,
  USER_CHANGE_PASSWORD: 8,
  ADD_FOOD_ITEM: 9,
  UPDATE_FOOD: 10,
  DELETE_FOOD: 11,
  GET_ONE_FOOD: 12,
};

const templatesType = {
  VERIFICATION_EMAIL: 1,
  FORGOT_PASS_VERIFICATION: 2,
};
module.exports = {
  express,
  cors,
  Validator,
  bcrypt,
  uuidv4,
  jwt,
  ejs,
  path,
  transporter,
  moment,
  multer,
  fs,
  cloudinary,
  corsOptions,
  query,
  Events,
  templatesType,
};
