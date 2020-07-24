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
			default: undefined,
		},
		seats: {
			type: Number,
			required: true,
		},
		price: {
			type: Number,
			default: undefined,
		},
		smoking: {
			type: Boolean,
			default: undefined,
		},
		car: {
			type: String,
			default: undefined,
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		/* users: [
			{
				type: Schema.Types.ObjectId,
				ref: 'User',
			},
		], */
	},
	{ timestamps: true },
);

module.exports = mongoose.model('Ride', rideSchema);
