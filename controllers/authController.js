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
			subject: 'Uspješna registracija',
			html: `
			<!doctype html>
			<html>
			<head>
				<meta name="viewport" content="width=device-width">
				<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
				<title>Simple Transactional Email</title>
				<style>
				/* -------------------------------------
					INLINED WITH htmlemail.io/inline
				------------------------------------- */
				/* -------------------------------------
					RESPONSIVE AND MOBILE FRIENDLY STYLES
				------------------------------------- */
				@media only screen and (max-width: 620px) {
				table[class=body] h1 {
					font-size: 28px !important;
					margin-bottom: 10px !important;
				}
				table[class=body] p,
						table[class=body] ul,
						table[class=body] ol,
						table[class=body] td,
						table[class=body] span,
						table[class=body] a {
					font-size: 16px !important;
				}
				table[class=body] .wrapper,
						table[class=body] .article {
					padding: 10px !important;
				}
				table[class=body] .content {
					padding: 0 !important;
				}
				table[class=body] .container {
					padding: 0 !important;
					width: 100% !important;
				}
				table[class=body] .main {
					border-left-width: 0 !important;
					border-radius: 0 !important;
					border-right-width: 0 !important;
				}
				table[class=body] .btn table {
					width: 100% !important;
				}
				table[class=body] .btn a {
					width: 100% !important;
				}
				table[class=body] .img-responsive {
					height: auto !important;
					max-width: 100% !important;
					width: auto !important;
				}
				}

				/* -------------------------------------
					PRESERVE THESE STYLES IN THE HEAD
				------------------------------------- */
				@media all {
				.ExternalClass {
					width: 100%;
				}
				.ExternalClass,
						.ExternalClass p,
						.ExternalClass span,
						.ExternalClass font,
						.ExternalClass td,
						.ExternalClass div {
					line-height: 100%;
				}
				.apple-link a {
					color: inherit !important;
					font-family: inherit !important;
					font-size: inherit !important;
					font-weight: inherit !important;
					line-height: inherit !important;
					text-decoration: none !important;
				}
				#MessageViewBody a {
					color: inherit;
					text-decoration: none;
					font-size: inherit;
					font-family: inherit;
					font-weight: inherit;
					line-height: inherit;
				}
				.btn-primary table td:hover {
					background-color: #34495e !important;
				}
				.btn-primary a:hover {
					background-color: #34495e !important;
					border-color: #34495e !important;
				}
				}
				</style>
			</head>
			<body class="" style="background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
				<span class="preheader" style="color: transparent; display: none; height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; width: 0;">Uspješna prijava</span>
				<table border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background-color: #f6f6f6;">
				<tr>
					<td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
					<td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; Margin: 0 auto; max-width: 580px; padding: 10px; width: 580px;">
					<div class="content" style="box-sizing: border-box; display: block; Margin: 0 auto; max-width: 580px; padding: 10px;">

						<!-- START CENTERED WHITE CONTAINER -->
						<table class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background: #ffffff; border-radius: 3px;">

						<!-- START MAIN CONTENT AREA -->
						<tr>
							<td class="wrapper" style="font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 20px;">
							<table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;">
								<tr>
								<td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">
									<p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; Margin-bottom: 15px;">Dobrodošli</p>
									<p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; Margin-bottom: 15px;">Pronađi nove vožnje danas</p>
									<table border="0" cellpadding="0" cellspacing="0" class="btn btn-primary" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; box-sizing: border-box;">
									<tbody>
										<tr>
										<td align="left" style="font-family: sans-serif; font-size: 14px; vertical-align: top; padding-bottom: 15px;">
											<table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: auto;">
											<tbody>
												<tr>
												<td style="font-family: sans-serif; font-size: 14px; vertical-align: top; background-color: #3498db; border-radius: 5px; text-align: center;"> <a href="http://htmlemail.io" target="_blank" style="display: inline-block; color: #ffffff; background-color: #3498db; border: solid 1px #3498db; border-radius: 5px; box-sizing: border-box; cursor: pointer; text-decoration: none; font-size: 14px; font-weight: bold; margin: 0; padding: 12px 25px; text-transform: capitalize; border-color: #3498db;">Pregledaj vožnje</a> </td>
												</tr>
											</tbody>
										</table>
										</td>
										</tr>
									</tbody>
									</table>
								</td>
								</tr>
							</table>
							</td>
						</tr>

						<!-- END MAIN CONTENT AREA -->
						</table>

						<!-- START FOOTER -->
						<div class="footer" style="clear: both; Margin-top: 10px; text-align: center; width: 100%;">
						<table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;">
							<tr>
							<td class="content-block" style="font-family: sans-serif; vertical-align: top; padding-bottom: 10px; padding-top: 10px; font-size: 12px; color: #999999; text-align: center;">
								<span class="apple-link" style="color: #999999; font-size: 12px; text-align: center;">StudentRides &copy;</span>
							</td>
							</tr>
							
						</table>
						</div>
						<!-- END FOOTER -->

					<!-- END CENTERED WHITE CONTAINER -->
					</div>
					</td>
					<td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
				</tr>
				</table>
			</body>
			</html>

			`,
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
			return next(new ErrorResponse('Neispravni podaci za prijavu', 401));
		}

		const comparison = await bcrypt.compare(password, foundUser.password);
		if (!comparison) {
			return next(new ErrorResponse('Neispravni podaci za prijavu', 401));
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
				subject: 'Token za ponovno postavljanje lozinke',
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
		next(error);
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
		return next(new ErrorResponse('Nije dopušteno', 400));
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
			return next(new ErrorResponse(`Problem s prijenosom`, 500));
		}
		let photoPath = `${process.env.BASE_URL}/uploads/${file.name}`;
		await User.findByIdAndUpdate(req.params.id, {
			photo: photoPath,
		});
		res.status(200).json({
			success: true,
			data: photoPath,
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
