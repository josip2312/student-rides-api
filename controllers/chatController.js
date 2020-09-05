const Chat = require('../models/Chat');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

const getChats = async (req, res, next) => {
	const id = req.params.id;
	try {
		const foundUser = await User.findById(id);
		if (!foundUser) {
			return next(new ErrorResponse('Korisnik nije pronađen', 404));
		}
		let chats = [];
		for (let i = 0; i < foundUser.chats.length; i++) {
			let chat = await Chat.findById(foundUser.chats[i]);
			chats.push(chat);
		}

		res.status(200).json(chats);
	} catch (error) {
		next(error);
	}
};

const createNewChat = async (req, res, next) => {
	const sender = req.body.sender;
	const senderName = req.body.senderName;
	const receiver = req.body.receiver;
	const receiverName = req.body.receiverName;
	const chats = req.body.chats;
	try {
		let exists = false;
		if (chats.length > 0) {
			for (let i = 0; i < chats.length; i++) {
				let chat = await Chat.findById(chats[i]);
				if (
					(chat.receiver === receiver && chat.sender === sender) ||
					(chat.receiver === sender && chat.sender === receiver)
				) {
					exists = true;
					break;
				}
			}
		}

		if (!exists) {
			const senderUser = await User.findById(sender);
			const receiverUser = await User.findById(receiver);
			const tempPassword1 = senderUser.password;
			const tempPassword2 = receiverUser.password;

			senderUser.password = undefined;
			receiverUser.password = undefined;
			const chat = new Chat({
				sender,
				receiver,
				members: [senderUser, receiverUser],
				messages: [],
			});

			const c1 = await chat.save();

			senderUser.password = tempPassword1;
			receiverUser.password = tempPassword2;

			senderUser.chats.push(chat);
			receiverUser.chats.push(chat);

			const recPromise = await receiverUser.save();
			const sendPromise = await senderUser.save();
			res.status(200).json({ data: 'New chat created' });
			return Promise.all([recPromise, sendPromise]);
		}
		res.status(409).json({ data: 'chat already exists' });
	} catch (error) {
		next(error);
	}
};
module.exports = {
	getChats,
	createNewChat,
};