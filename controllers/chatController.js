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
			let chat = await Chat.findById(foundUser.chats[i]).lean();
			chats.push(chat);
		}

		res.status(200).json({
			chats,
			success: true,
		});
	} catch (error) {
		next(error);
	}
};

const createNewChat = async (req, res, next) => {
	const { sender, receiver } = req.body;

	const senderUser = await User.findById(sender);
	const chats = senderUser.chats;

	if (sender === receiver) {
		return next(new ErrorResponse('Greška', 405));
	}
	if (!chats) {
		return next(new ErrorResponse('Korisnik nije pronađen', 404));
	}
	try {
		let exists = false;

		for (let i = 0; i < chats.length; i++) {
			let chat = await Chat.findById(chats[i]);
			if (chat) {
				if (
					(chat.receiver === receiver && chat.sender === sender) ||
					(chat.receiver === sender && chat.sender === receiver) ||
					receiver === sender
				) {
					exists = true;
					break;
				}
			}
		}

		if (!exists) {
			const receiverUser = await User.findById(receiver);
			const tempPassword1 = senderUser.password;
			const tempPassword2 = receiverUser.password;

			senderUser.password = undefined;
			receiverUser.password = undefined;

			const chat = new Chat({
				sender,
				receiver,
				senderFullName: `${senderUser.name} ${senderUser.lastname}`,
				receiverFullName: `${receiverUser.name} ${receiverUser.lastname}`,
				messages: [],
			});

			senderUser.password = tempPassword1;
			receiverUser.password = tempPassword2;

			senderUser.chats.push(chat);
			receiverUser.chats.push(chat);

			const chatPromise = await chat.save();
			const recPromise = await receiverUser.save();
			const sendPromise = await senderUser.save();
			if (!recPromise || !sendPromise) {
				return next(new ErrorResponse('Korisnik nije pronađen', 404));
			}
			res.status(200).json({ data: 'New chat created', success: true });
			return Promise.all([chatPromise, recPromise, sendPromise]);
		}
		return next(new ErrorResponse('Razgovor već postoji', 409));
	} catch (error) {
		next(error);
	}
};
const deleteChat = async (req, res, next) => {
	const id = req.params.id;
	try {
		const foundChat = await Chat.findById(id);
		if (!foundChat) {
			return next(new ErrorResponse('Razgovor nije pronađen', 404));
		}

		const user1 = await User.findById(foundChat.sender);
		const user2 = await User.findById(foundChat.receiver);

		if (!user1) {
			const removedChat = await Chat.deleteOne({ _id: id });
			user2.chats.pull(foundChat._id);
			const user2Save = await user2.save();
			Promise.all([removedChat, user2Save]);
			return next(new ErrorResponse('Korisnik ne postoji', 404));
		}
		if (!user2) {
			const removedChat = await Chat.deleteOne({ _id: id });
			user1.chats.pull(foundChat._id);
			const user1Save = await user1.save();
			Promise.all([removedChat, user1Save]);

			return next(new ErrorResponse('Korisnik ne postoji', 404));
		}

		user1.chats.pull(foundChat._id);
		user2.chats.pull(foundChat._id);

		const removedChat = await Chat.deleteOne({ _id: id });
		const user1Save = await user1.save();
		const user2Save = await user2.save();

		res.status(200).json({ message: 'Razgovor uklonjen', success: true });
		return Promise.all([removedChat, user1Save, user2Save]);
	} catch (error) {
		next(error);
	}
};
module.exports = {
	getChats,
	createNewChat,
	deleteChat,
};
