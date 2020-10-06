const Ride = require('../models/Ride');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const ObjectID = require('mongodb').ObjectID;

const getAllRides = async (req, res, next) => {
	try {
		const rides = await Ride.find().lean();
		if (!rides) {
			return next(new ErrorResponse('Nema vožnji', 404));
		}

		res.status(200).json({ rides, success: true });
	} catch (error) {
		next(error);
	}
};

const postRide = async (req, res, next) => {
	const {
		start,
		end,
		date,
		startTime,
		contact,
		seats,
		price,
		smoking,
		car,
	} = req.body;

	const userId = req.body.userId;
	try {
		const foundUser = await User.findById(userId);

		const ride = new Ride({
			user: userId,
			start,
			end,
			date,
			startTime,
			contact,
			seats,
			price,
			smoking,
			car,
			fullName: `${foundUser.name} ${foundUser.lastname}`,
			userPhoto: foundUser.photo,
		});

		foundUser.rides.push(ride);

		const savedRide = await ride.save();
		const savedUser = await foundUser.save();

		res.status(201).json({
			success: true,
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
			success: true,
			message: 'Vožnja uklonjena',
		});
		return Promise.all([removedRide, userToUpdate]);
	} catch (error) {
		next(error);
	}
};
const editRide = async (req, res, next) => {
	const id = req.params.id;

	const {
		start,
		end,
		startTime,
		date,
		contact,
		seats,
		price,
		smoking,
		car,
	} = req.body;

	try {
		const foundRide = await Ride.findById(id);

		if (foundRide.user.toString() !== req.userId) {
			return next(new ErrorResponse('Nemate autorizaciju', 403));
		}

		const savedRide = await foundRide.updateOne({
			start,
			end,
			startTime,
			date,
			contact,
			seats,
			price,
			smoking,
			car,
		});

		res.status(200).json({
			success: true,
			message: 'Vožnja ažurirana',
			ride: savedRide,
		});
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

	res.status(200).json({
		success: true,
		message: 'Korisnik uklonjen iz vožnje',
	});
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

		res.status(200).json({ success: true, message: 'Vožnja rezervirana' });

		return Promise.all([userPromise, ridePromise]);
	} catch (error) {
		next(error);
	}
};

const deleteExpiredRides = async (req, res, next) => {
	const rides = await Ride.find();

	const deletedRides = [];
	for (let i = 0; i > rides.length; i++) {
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
	res.status(200).json({ success: true });
};
module.exports = {
	getAllRides,
	postRide,
	deleteRide,
	editRide,
	removeUserFromRide,
	reserveRide,
	deleteExpiredRides,
};
