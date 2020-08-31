const crypto = require('crypto');

const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	lastname: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
	},
	password: {
		type: String,
		required: true,
	},
	photo: {
		type: String,
		default: `${process.env.BASE_URL}/uploads/user.svg`,
	},
	contact: {
		type: String,
		default: undefined,
	},
	description: {
		type: String,
		default: undefined,
	},
	rides: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Ride',
		},
	],
	reservedRides: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Ride',
		},
	],
	chats: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Chat',
		},
	],
	//need unique id
	notifications: [{ type: Object }],
	resetPasswordToken: String,
	resetPasswordExpire: Date,
});

userSchema.methods.getResetPasswordToken = function () {
	//generate token
	const resetToken = crypto.randomBytes(20).toString('hex');
	//hash token
	this.resetPasswordToken = crypto
		.createHash('sha256')
		.update(resetToken)
		.digest('hex');

	//set expiration
	this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
	return resetToken;
};

module.exports = mongoose.model('User', userSchema);
