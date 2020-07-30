const express = require('express');
const router = express.Router();

const User = require('../models/User');
const isAuth = require('../middleware/isAuth');
const { body } = require('express-validator');

const authController = require('../controllers/authController');

router.post(
	'/register',

	[
		body('name').trim().not().isEmpty(),
		body('lastname').trim().not().isEmpty(),
		body('email')
			.isEmail()
			.withMessage('Please enter a valid email')
			.custom((value, { req }) => {
				return User.findOne({ email: value }).then((user) => {
					if (user) {
						return Promise.reject('Email address already exists');
					}
				});
			}),

		body('password').trim().isLength({ min: 6 }),
	],
	authController.register,
);
router.post('/login', authController.login);
router.post('/forgotpassword', authController.forgotPassword);
router.put('/resetpassword/:resettoken', authController.resetPassword);
router.get('/user/:id', authController.getUser);
router.put('/user/:id/photo', authController.uploadUserPhoto);
router.get('/user/:id/photo', authController.getUserPhoto);

module.exports = router;
