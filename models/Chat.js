const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
	from: {
		type: String,
		required: true,
	},
	content: {
		type: String,
		required: true,
	},
	receiverHasRead: {
		type: Boolean,
		default: false,
	},
	sender: {
		type: String,
		required: true,
	},
	receiver: {
		type: String,
		required: true,
	},
});

const chatSchema = new Schema({
	sender: {
		type: String,
		required: true,
	},
	receiver: {
		type: String,
		required: true,
	},
	senderFullName: {
		type: String,
		required: true,
	},
	receiverFullName: {
		type: String,
		required: true,
	},
	messages: [
		{
			type: messageSchema,
		},
	],
});

module.exports = mongoose.model('Chat', chatSchema);
