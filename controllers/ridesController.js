const Ride = require('../models/Ride');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const ObjectID = require('mongodb').ObjectID;

const getAllRides = async (req, res, next) => {
	try {
		const rides = await Ride.find();
		if (!rides) {
			return next(new ErrorResponse('Nema vožnji', 404));
		}

		res.status(200).json(rides);
	} catch (error) {
		next(error);
	}
};

const getSingleRide = async (req, res, next) => {
	const id = req.params.id;
	try {
		const ride = await Ride.findById(id);
		if (!ride) {
			return next(new ErrorResponse('Vožnja nije pronađena', 404));
		}
		res.status(200).json(ride);
	} catch (error) {
		next(error);
	}
};

const getUserRides = async (req, res, next) => {
	const id = req.params.id;
	try {
		const foundUser = await User.findById(id);
		if (!foundUser) {
			return next(new ErrorResponse('Korisnik nije pronađen', 404));
		}
		let rides = [];
		for (let i = 0; i < foundUser.rides.length; i++) {
			let ride = await Ride.findById(foundUser.rides[i]);
			if (!ride) {
				return next(new ErrorResponse('Nema vožnji'));
			}
			rides.push(ride);
		}

		res.status(200).json(rides);
	} catch (error) {
		next(error);
	}
};
const getReservedRides = async (req, res, next) => {
	const id = req.params.id;
	try {
		const foundUser = await User.findById(id);
		if (!foundUser) {
			return next(new ErrorResponse('Korisnik nije pronađen', 404));
		}
		let reserved = [];
		for (let i = 0; i < foundUser.reservedRides.length; i++) {
			let reservedRide = await Ride.findById(foundUser.reservedRides[i]);
			reserved.push(reservedRide);
		}

		res.status(200).json(reserved);
	} catch (error) {
		next(error);
	}
};

const postRide = async (req, res, next) => {
	const start = req.body.start;
	const end = req.body.end;
	const date = req.body.date;
	const startTime = req.body.startTime;
	const contact = req.body.contact;
	const seats = req.body.seats;
	const price = req.body.price;
	const userId = req.body.userId;
	const smoking = req.body.smoking;
	const car = req.body.car;

	const foundUser = await User.findById(userId);

	const ride = new Ride({
		start,
		end,
		date,
		startTime,
		contact,
		seats,
		price,
		user: userId,
		smoking,
		car,
		fullName: `${foundUser.name} ${foundUser.lastname}`,
		userPhoto: foundUser.photo,
	});

	try {
		foundUser.rides.push(ride);

		const savedRide = await ride.save();
		const savedUser = await foundUser.save();

		res.status(201).json({
			message: 'Voznja stvorena',
			ride: savedRide,
			foundUser: { _id: foundUser._id },
		});
		return Promise.all([savedRide, savedUser]);
	} catch (error) {
		next(error);
	}
};

const deleteRide = async (req, res, next) => {
	const id = req.params.id;
	try {
		const foundRide = await Ride.findById(id);
		if (!foundRide) {
			return next(new ErrorResponse('Voznja nije pronađena', 404));
		}
		if (foundRide.user.toString() !== req.userId) {
			return next(new ErrorResponse('Niste autorizirani', 403));
		}

		for (let i = 0; i < foundRide.users.length; i++) {
			let user = await User.findById(foundRide.users[i]._id);

			user.reservedRides.pull(foundRide._id);
			await user.save();
		}

		const removedRide = await Ride.deleteOne({ _id: id });
		const userToUpdate = await User.findById(req.userId);

		userToUpdate.rides.pull(id);

		await userToUpdate.save();

		res.status(200).json({
			message: 'Voznja uklonjena',
			ride: removedRide,
		});
		return Promise.all([removedRide, userToUpdate]);
	} catch (error) {
		next(error);
	}
};
const editRide = async (req, res, next) => {
	const id = req.params.id;
	const start = req.body.start;
	const end = req.body.end;
	const date = req.body.date;
	const contact = req.body.contact;
	const seats = req.body.seats;
	const price = req.body.price;
	const smoking = req.body.smoking;
	const car = req.body.car;

	try {
		const foundRide = await Ride.findById(id);

		if (foundRide.user.toString() !== req.userId) {
			return next(new ErrorResponse('Nemate autorizaciju', 403));
		}
		foundRide.start = start;
		foundRide.end = end;
		foundRide.date = date;
		foundRide.contact = contact;
		foundRide.seats = seats;
		foundRide.price = price;
		foundRide.smoking = smoking;
		foundRide.car = car;

		const savedRide = await foundRide.save();
		res.status(200).json({ message: 'Vožnja ažurirana', ride: savedRide });
	} catch (error) {
		error.statusCode = 403;
		next(error);
	}
};
const removeUserFromRide = async (req, res, next) => {
	const rideId = req.params.id;
	const userId = req.body.userId;

	const foundRide = await Ride.findById(rideId);

	foundRide.users = foundRide.users.filter((user) => {
		return user._id === userId;
	});

	foundRide.seats++;

	const foundUser = await User.findById(userId);

	foundUser.notifications.push({
		message: `Uklonjeni ste s vožnje koju ste rezervirali`,
		_id: new ObjectID(),
		rideId,
	});

	foundUser.reservedRides.pull(foundRide._id);
	const userPromise = await foundUser.save();
	const ridePromise = await foundRide.save();

	res.status(200).json({ message: 'Korisnik uklonjen iz vožnje' });
	return Promise.all([userPromise, ridePromise]);
};

const reserveRide = async (req, res, next) => {
	const userId = req.body.userId;
	const rideId = req.params.id;

	try {
		const foundRide = await Ride.findById(rideId);

		if (!foundRide) {
			return next(new ErrorResponse('Vožnja nije pronađena', 404));
		}
		if (foundRide.seats === 0) {
			return next(new ErrorResponse('Vožnja popunjena', 403));
		}

		for (let i = 0; i < foundRide.users.length; i++) {
			if (foundRide.users[i]._id.toString() === userId.toString()) {
				return next(new ErrorResponse('Vožnja vec rezervirana', 403));
			}
		}
		const userToNotify = await User.findById(foundRide.user);
		const userToAdd = await User.findById(userId);

		if (foundRide.seats === 1) {
			foundRide.seats -= 1;
			userToNotify.notifications.push({
				message: `Korisnik ${userToAdd.name} ${userToAdd.lastname} je rezervirao vasu vožnju, vožnja je popunjena`,
				_id: new ObjectID(),
				rideId,
			});
		} else {
			foundRide.seats -= 1;
			userToNotify.notifications.push({
				message: `Korisnik ${userToAdd.name} ${userToAdd.lastname} je rezervirao vasu vožnju`,
				_id: new ObjectID(),
				rideId,
			});
		}

		userToAdd.password = undefined;
		foundRide.users.push(userToAdd);

		User.findOneAndUpdate(
			{
				_id: userToAdd._id,
			},
			{ $push: { reservedRides: foundRide } },
			function (error, success) {
				if (error) {
					console.log(error);
				} else {
					console.log(success);
				}
			},
		);

		const userPromise = await userToNotify.save();
		const ridePromise = await foundRide.save();

		res.status(200).json({ message: 'Vožnja rezervirana' });

		return Promise.all([userPromise, ridePromise]);
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
		res.status(200).json(foundUser.notifications);
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
const deleteExpiredRides = async (req, res, next) => {
	const rides = await Ride.find();

	const deletedRides = [];
	for (let i = 0; i < rides.length; i++) {
		if (rides[i].date.getTime() < Date.now()) {
			const deletedRide = await Ride.deleteOne({ _id: rides[i]._id });
			if (deletedRide) {
				const user = await User.findById(rides[i].user);
				deletedRides.push(deletedRide);
				user.rides.pull(rides[i]._id);
				await user.save();
			}
		}
	}
	res.status(200).json(deletedRides);
};
module.exports = {
	getAllRides,
	getUserRides,
	getReservedRides,
	postRide,
	getSingleRide,
	deleteRide,
	editRide,
	removeUserFromRide,
	reserveRide,
	readNotification,
	deleteAllNotifications,
	deleteExpiredRides,
};
