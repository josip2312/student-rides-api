const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const transporter = nodemailer.createTransport(
	sendgridTransport({
		auth: {
			api_key: process.env.SENDGRID_API_KEY,
		},
	}),
);

const register = async (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		const error = new Error('Validation failed');
		error.statusCode = 422;
		error.data = errors.array();
		throw error;
	}
	const name = req.body.name;
	const lastname = req.body.lastname;
	const email = req.body.email;
	const password = req.body.password;

	try {
		const hashedPassword = await bcrypt.hash(password, 12);
		const user = new User({
			name,
			lastname,
			email,
			password: hashedPassword,
		});

		const savedUser = await user.save();
		await transporter.sendMail({
			to: email,
			from: process.env.FROM_EMAIL,
			subject: 'You signed up!',
			html: '<h1>You signed up </h1>',
		});
		res.status(201).json({
			message: 'User created',
			userId: savedUser._id,
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

const login = async (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;
	let loadedUser;
	try {
		const foundUser = await User.findOne({ email: email });
		if (!foundUser) {
			const error = new Error(
				'A user with this email could not be found',
			);
			error.statusCode = 401;
			throw error;
		}

		const comparison = await bcrypt.compare(password, foundUser.password);
		if (!comparison) {
			const error = new Error('Wrong password');
			error.statusCode = 401;
			throw error;
		}
		const token = jwt.sign(
			{
				email: foundUser.email,
				userId: foundUser._id.toString(),
			},
			process.env.JWT_SECRET,
			{ expiresIn: '1h' },
		);
		res.status(200).json({
			token: token,
			userId: foundUser._id.toString(),
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

const forgotPassword = async (req, res, next) => {
	try {
		const user = await User.findOne({ email: req.body.email });
		if (!user) {
			const error = new Error('Could not find user');
			error.statusCode = 404;
			throw error;
		}
		const resetToken = user.getResetPasswordToken();
		await user.save();

		const resetUrl = `${req.protocol}://${req.get(
			'host',
		)}/resetpassword/${resetToken}`;

		const message = `Zatrazili ste resetiranje lozinke, klikni na link: ${resetUrl}`;

		try {
			await transporter.sendMail({
				to: user.email,
				from: process.env.FROM_EMAIL,
				subject: 'Password reset token',
				html: `<h1>${message}</h1>`,
			});
			res.status(200).json({ success: true });
		} catch (error) {
			user.resetPasswordToken = undefined;
			user.resetPasswordExpire = undefined;
			await user.save();

			error.statusCode = 500;
			throw error;
		}
	} catch (error) {
		next(error);
	}
};

const getUser = async (req, res, next) => {
	const id = req.params.id;
	try {
		const user = await User.findById(id);
		if (!user) {
			const error = new Error('Could not find user');
			error.statusCode = 404;
			next(error);
		}
		res.status(200).json(user);
	} catch (error) {
		next(error);
	}
};

module.exports = {
	register,
	login,
	forgotPassword,
	getUser,
};
