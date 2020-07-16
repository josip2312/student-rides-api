const Ride = require('../models/Ride');
const User = require('../models/User');

const getIndex = async (req, res) => {
	try {
		const rides = await Ride.find();
		if (!rides) {
			const error = new Error('There are no rides');
			error.statusCode = 404;
			next(error);
		}
		res.status(200).json(rides);
	} catch (error) {
		res.json({ message: error });
	}
};

const getUserRides = async (req, res, next) => {
	const id = req.params.id;
	try {
		const foundUser = await User.findById(id);
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
	const userId = req.userId;
	console.log({ start, end, date, contact, seats, price, userId });
	const ride = new Ride({
		start,
		end,
		date,
		contact,
		seats,
		price,
		user: userId,
	});

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
			const error = new Error('Could not find ride');
			error.statusCode = 404;
			next(error);
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
			const error = new Error('Could not find ride');
			error.statusCode = 404;
			next(error);
		}
		if (foundRide.user.toString() !== req.userId) {
			const error = new Error('Not authorized');
			error.statusCode = 404;
			next(error);
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
	console.log('Id ' + id);
	try {
		const foundRide = await Ride.findById(id);
		console.log(foundRide);
		if (foundRide.user.toString() !== req.userId) {
			const error = new Error('Not authorized');
			error.statusCode = 403;
			next(error);
		}
		foundRide.start = start;
		foundRide.end = end;
		foundRide.date = date;
		foundRide.contact = contact;
		foundRide.seats = seats;
		foundRide.price = price;

		const savedRide = await foundRide.save();
		res.json({ message: 'Ride updated', ride: savedRide });
	} catch (error) {
		error.statusCode = 403;
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
};
