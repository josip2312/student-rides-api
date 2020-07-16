const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const rideSchema = new Schema(
	{
		start: {
			type: String,
			required: true,
		},
		end: {
			type: String,
			required: true,
		},
		date: {
			type: Date,
			required: true,
		},
		contact: {
			type: String,
			default: '-',
		},
		seats: {
			type: Number,
			required: true,
		},
		price: {
			type: Number,
			default: null,
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{ timestamps: true },
);

module.exports = mongoose.model('Ride', rideSchema);
