const crypto = require('crypto');
const mongoose = require('mongoose');
const { type } = require('os');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
	from: String,
	content: String,
	receiverHasRead: Boolean,
	sender: String,
	receiver: String,
});

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
			type: messageSchema,
		},
	],
});

module.exports = mongoose.model('Chat', chatSchema);
