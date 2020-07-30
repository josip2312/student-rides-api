const { validationResult } = require('express-validator');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

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
		return next(new ErrorResponse('Email address already exists'));
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
		transporter.sendMail({
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
			return next(
				new ErrorResponse(
					'A user with this email could not be found',
					401,
				),
			);
		}

		const comparison = await bcrypt.compare(password, foundUser.password);
		if (!comparison) {
			return next(new ErrorResponse('Wrong password', 401));
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
		next(err);
	}
};

const forgotPassword = async (req, res, next) => {
	try {
		const user = await User.findOne({ email: req.body.email });
		if (!user) {
			return next(new ErrorResponse('Could not find user', 404));
		}
		const resetToken = user.getResetPasswordToken();
		await user.save();

		const resetUrl = `${process.env.CLIENT_URL}/auth/newpassword/${resetToken}`;

		const message = `Zatrazili ste resetiranje lozinke, klikni na link: ${resetUrl}`;

		try {
			await transporter.sendMail({
				to: user.email,
				from: process.env.FROM_EMAIL,
				subject: 'Password reset token',
				html: `<h1>${message}</h1>`,
			});
			res.status(200).json({ success: true, data: 'Email sent' });
		} catch (error) {
			user.resetPasswordToken = undefined;
			user.resetPasswordExpire = undefined;
			await user.save();

			error.statusCode = 500;
			return next(new ErrorResponse('Could not reset password', 500));
		}
	} catch (error) {
		next(err);
	}
};

const resetPassword = async (req, res, next) => {
	const resetToken = crypto
		.createHash('sha256')
		.update(req.params.resettoken)
		.digest('hex');

	const user = await User.findOne({
		resetPasswordToken: resetToken,
		resetPasswordExpire: { $gt: Date.now() },
	});

	if (!user) {
		return next(new ErrorResponse('Invalid token', 400));
	}
	const password = req.body.password;
	const hashedPassword = await bcrypt.hash(password, 12);

	user.password = hashedPassword;
	user.resetPasswordToken = undefined;
	user.resetPasswordExpire = undefined;

	await user.save();
	const token = jwt.sign(
		{
			email: user.email,
			userId: user._id.toString(),
		},
		process.env.JWT_SECRET,
		{ expiresIn: '1h' },
	);
	res.status(200).json({
		token: token,
		userId: user._id.toString(),
	});
};

const getUser = async (req, res, next) => {
	const id = req.params.id;
	try {
		const user = await User.findById(id);
		if (!user) {
			return next(new ErrorResponse('Could not find user', 404));
		}
		res.status(200).json(user);
	} catch (error) {
		next(error);
	}
};

const uploadUserPhoto = async (req, res, next) => {
	const user = await User.findById(req.params.id);

	if (!user) {
		return next(new ErrorResponse('Could not find user', 404));
	}

	if (!req.files) {
		return next(new ErrorResponse('Please upload a file', 400));
	}

	const file = req.files.image;
	if (!file.mimetype.startsWith('image')) {
		return next(new ErrorResponse('Please upload an image file', 400));
	}

	if (file.size > process.env.MAX_FILE_UPLOAD) {
		return next(
			new ErrorResponse(
				`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
				400,
			),
		);
	}
	//custom filename
	file.name = `photo_${user._id}${path.parse(file.name).ext}`;

	file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
		if (err) {
			console.error(err);
			return next(new ErrorResponse(`Problem with file upload`, 500));
		}
		await User.findByIdAndUpdate(req.params.id, { photo: file.name });
		res.status(200).json({
			success: true,
			data: file.name,
		});
	});

	console.log(file.name);
};
const getUserPhoto = async (req, res, next) => {
	const id = req.params.id;
	try {
		const user = await User.findById(id);
		if (!user) {
			return next(new ErrorResponse('Could not find user', 404));
		}
		res.status(200).json(user.photo);
	} catch (error) {
		next(error);
	}
};

module.exports = {
	register,
	login,
	getUser,
	forgotPassword,
	resetPassword,
	uploadUserPhoto,
	getUserPhoto,
};
