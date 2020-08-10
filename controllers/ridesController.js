const Ride = require('../models/Ride');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
//const asyncHandler = require('../middleware/async');

const getIndex = async (req, res, next) => {
	try {
		const rides = await Ride.find();
		if (!rides) {
			return next(new ErrorResponse('Nema voznji', 404));
		}
		res.status(200).json(rides);
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
			rides.push(ride);
		}
		res.status(200).json(rides);
	} catch (error) {
		next(error);
	}
};

const postRide = async (req, res, next) => {
	const start = req.body.start;
	const end = req.body.end;
	const date = req.body.date;
	const contact = req.body.contact;
	const seats = req.body.seats;
	const price = req.body.price;
	const userId = req.body.userId;
	const smoking = req.body.smoking;
	const car = req.body.car;

	const ride = new Ride({
		start,
		end,
		date,
		contact,
		seats,
		price,
		user: userId,
		smoking,
		car,
	});
	console.log(ride);
	try {
		const savedRide = await ride.save();
		const foundUser = await User.findById(userId);
		foundUser.rides.push(ride);
		const savedUser = await foundUser.save();
		res.status(201).json({
			message: 'Ride created',
			ride: savedRide,
			foundUser: { _id: foundUser._id, username: foundUser.username },
		});
	} catch (error) {
		next(error);
	}
};

const getRide = async (req, res, next) => {
	const id = req.params.id;
	try {
		const ride = await Ride.findById(id);
		if (!ride) {
			return next(new ErrorResponse('Voznja nije pronađena', 404));
		}
		res.status(200).json(ride);
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
			return next(new ErrorResponse('Nemate autorizaciju', 403));
		}
		const removedRide = await Ride.deleteOne({ _id: id });
		const userToUpdate = await User.findById(req.userId);
		userToUpdate.rides.pull(id);

		await userToUpdate.save();
		res.status(200).json({ message: 'Ride removed', ride: removedRide });
	} catch (error) {
		next(error);
	}
};
const updateRide = async (req, res, next) => {
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
		res.json({ message: 'Ride updated', ride: savedRide });
	} catch (error) {
		error.statusCode = 403;
		next(error);
	}
};

const reserveRide = async (req, res, next) => {
	const userId = req.body.userId;
	const rideId = req.params.id;

	try {
		const foundRide = await Ride.findById(rideId);

		if (!foundRide) {
			return next(new ErrorResponse('Voznja nije pronađena', 404));
		}
		const userToAdd = await User.findById(userId);

		for (let i = 0; i < foundRide.users.length; i++) {
			if (foundRide.users[i]._id.toString() === userId.toString()) {
				return next(new ErrorResponse('Voznja vec rezervirana', 403));
			}
		}

		foundRide.users.push(userToAdd);
		foundRide.seats = foundRide.seats - 1;
		await foundRide.save();

		res.json({ message: 'User added' });
	} catch (error) {
		next(error);
	}
};

module.exports = {
	getIndex,
	getUserRides,
	postRide,
	getRide,
	deleteRide,
	updateRide,
	reserveRide,
};
