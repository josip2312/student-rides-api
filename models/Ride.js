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
			type: String,
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
		fullName: {
			type: String,
			default: undefined,
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
		expireAt: {
			type: Date,
			default: this.createdAt,
			index: { expires: '1m' },
		},
	},

	{ timestamps: true },
);

module.exports = mongoose.model('Ride', rideSchema);
