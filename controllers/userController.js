const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const util = require('util');

const sharp = require('sharp');
const googleStorage = require('../config/');

const getUser = async (req, res, next) => {
	const id = req.params.id;
	try {
		const user = await User.findById(id).lean();
		if (!user) {
			return next(new ErrorResponse('Korisnik nije pronađen', 404));
		}
		user.password = undefined;
		res.status(200).json({ success: true, user });
	} catch (error) {
		next(error);
	}
};
const editUser = async (req, res, next) => {
	const id = req.params.id;

	const { name, lastname, contact, description } = req.body;

	try {
		const user = await User.findByIdAndUpdate(
			id,
			{
				name,
				lastname,
				contact,
				description,
			},
			(err, success) => {
				if (err) {
					return next(
						new ErrorResponse('Uređivanje nije uspjelo', 401),
					);
				}
			},
		);

		res.status(200).json({ success: true });
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

	const file = req.files.file;

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

	try {
		//uploading to google cloud storagee
		const bucket = googleStorage.bucket('student_rides_images');

		const blob = bucket.file(file.name);
		const remoteWriteStream = blob.createWriteStream();
		sharp(file.data)
			.resize({ width: 500 })
			.pipe(remoteWriteStream)
			.on('error', () => {
				return next(new ErrorResponse('Greška u prijenosu'));
			})
			.on('finish', async () => {
				const publicUrl = util.format(
					`https://storage.googleapis.com/${bucket.name}/${blob.name}`,
				);
				await User.findByIdAndUpdate(req.params.id, {
					photo: publicUrl,
				});
				res.status(200).json({
					message: 'Fotografija postavljena',
					data: publicUrl,
				});
			});
	} catch (error) {
		next(error);
	}
};

const readNotification = async (req, res, next) => {
	const userId = req.body.userId;
	const notificationId = req.body.notificationId;
	const foundUser = await User.findById(userId);
	if (!foundUser) {
		return next(new ErrorResponse('Korisnik nije pronađen', 404));
	}
	try {
		foundUser.notifications = foundUser.notifications.filter(
			(notification) => {
				return (
					notification._id.toString() !== notificationId.toString()
				);
			},
		);
		await foundUser.save();
		res.status(200).json({
			success: true,
			notifications: foundUser.notifications,
		});
	} catch (error) {
		next(error);
	}
};

const deleteAllNotifications = async (req, res, next) => {
	const userId = req.params.id;

	const foundUser = await User.findById(userId);
	if (!foundUser) {
		return next(new ErrorResponse('Korisnik nije pronađen', 404));
	}
	try {
		foundUser.notifications = undefined;
		await foundUser.save();
		res.status(200).json({ message: 'Obavijesti uklonjene' });
	} catch (error) {
		next(error);
	}
};

module.exports = {
	getUser,
	uploadUserPhoto,
	editUser,
	readNotification,
	deleteAllNotifications,
};
