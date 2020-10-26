const crypto = require('crypto');
const bcrypt = require('bcryptjs');

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
	notifications: [{ type: Object }],

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

	confirmed: {
		type: Boolean,
		default: false,
	},
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

userSchema.methods.matchPassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};
userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) {
		next();
	}

	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
