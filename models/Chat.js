const crypto = require('crypto');
const mongoose = require('mongoose');
const { type } = require('os');
const Schema = mongoose.Schema;

const chatSchema = new Schema({
	sender: {
		type: String,
	},
	receiver: {
		type: String,
	},
	members: [
		{
			type: Object,
		},
	],
	messages: [
		{
			type: Object,
		},
	],
});

module.exports = mongoose.model('Chat', chatSchema);
