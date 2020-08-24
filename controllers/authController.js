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
		return next(new ErrorResponse('Email adresa već postoji'));
	}
	const name = req.body.name;
	const lastname = req.body.lastname;
	const email = req.body.email;
	const password = req.body.password;

	try {
		const salt = await bcrypt.genSalt();
		const hashedPassword = await bcrypt.hash(password, salt);
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
			message: 'Registracija uspjesna',
			userId: savedUser._id,
		});
	} catch (err) {
		next(err);
	}
};

const login = async (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;

	try {
		const foundUser = await User.findOne({ email: email });
		if (!foundUser) {
			return next(
				new ErrorResponse(
					'Korisnik s tom email adresom nije pronađen',
					401,
				),
			);
		}

		const comparison = await bcrypt.compare(password, foundUser.password);
		if (!comparison) {
			return next(new ErrorResponse('Neispravna lozinka', 401));
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
			message: 'Ulogirani ste',
		});
	} catch (err) {
		next(err);
	}
};

const forgotPassword = async (req, res, next) => {
	try {
		const user = await User.findOne({ email: req.body.email });
		if (!user) {
			return next(new ErrorResponse('Korisnik ne postoji', 404));
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
			res.status(200).json({
				success: true,
				message: `Email poslan na adresu ${user.email}`,
			});
		} catch (error) {
			user.resetPasswordToken = undefined;
			user.resetPasswordExpire = undefined;
			await user.save();
			return next(
				new ErrorResponse('Ponovno postavljanje nije uspjelo', 500),
			);
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
	const salt = await bcrypt.genSalt();
	const hashedPassword = await bcrypt.hash(password, salt);
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
		message: 'Ulogirani ste',
	});
};

const getUser = async (req, res, next) => {
	const id = req.params.id;
	try {
		const user = await User.findById(id);
		if (!user) {
			return next(new ErrorResponse('Korisnik nije pronađen', 404));
		}
		user.password = undefined;
		res.status(200).json(user);
	} catch (error) {
		next(error);
	}
};
const editUser = async (req, res, next) => {
	const id = req.params.id;
	const name = req.body.name;
	const lastname = req.body.lastname;
	const email = req.body.email;
	const contact = req.body.contact;
	const description = req.body.description;

	try {
		const user = await User.findById(id);
		if (!user) {
			return next(new ErrorResponse('Korisnik nije pronađen', 404));
		}
		user.name = name;
		user.lastname = lastname;
		user.email = email;
		user.contact = contact;
		user.description = description;

		await user.save();
		user.password = undefined;
		res.status(200).json(user);
	} catch (error) {
		next(error);
	}
};
const uploadUserPhoto = async (req, res, next) => {
	const user = await User.findById(req.params.id);

	if (!user) {
		return next(new ErrorResponse('Korisnik nije pronađen', 404));
	}

	if (!req.files) {
		return next(new ErrorResponse('Please upload a file', 400));
	}

	const file = req.files.image;
	if (!file.mimetype.startsWith('image')) {
		return next(new ErrorResponse('Datoteka mora biti slika', 400));
	}

	if (file.size > process.env.MAX_FILE_UPLOAD) {
		return next(
			new ErrorResponse(
				`'Datoteka mora biti manja od ${process.env.MAX_FILE_UPLOAD}`,
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
};

const getUserPhoto = async (req, res, next) => {
	const id = req.params.id;
	try {
		const user = await User.findById(id);
		if (!user) {
			return next(new ErrorResponse('Korisnik nije pronađen', 404));
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
	editUser,
};
