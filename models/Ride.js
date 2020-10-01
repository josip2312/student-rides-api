const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rideSchema = new Schema({
	start: {
		type: String,
		required: true,
	},
	end: {
		type: String,
		required: true,
	},
	startTime: {
		type: String,
		required: true,
	},
	date: {
		type: Date,
		required: true,
	},
	contact: {
		type: String,
		required: true,
	},
	seats: {
		type: Number,
		required: true,
	},
	price: {
		type: String,
		required: true,
	},
	smoking: {
		type: Boolean,
		required: true,
	},
	car: {
		type: String,
		default: undefined,
	},
	fullName: {
		type: String,
		default: undefined,
	},
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},

	userPhoto: {
		type: String,
		default: undefined,
	},
	users: [
		{
			type: Object,
			default: undefined,
		},
	],
});

module.exports = mongoose.model('Ride', rideSchema);
