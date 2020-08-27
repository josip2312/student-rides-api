const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fileupload = require('express-fileupload');

const errorHandler = require('./middleware/error');
const ridesRoutes = require('./routes/rides');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();
const http = require('http').createServer(app);

const io = require('socket.io')(http);
//middlewares

app.use(cors());

app.use(bodyParser.json());

//file upload
app.use(fileupload());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/rides', ridesRoutes);
app.use('/auth', authRoutes);

app.use(errorHandler);

mongoose.connect(
	process.env.DB_URI,
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true,
	},
	(err) => {
		console.log(err);
	},
);

http.listen(process.env.PORT);

//chatting functionality
const ErrorResponse = require('./utils/errorResponse');
const User = require('./models/User');

/* const users = {};
async function getUsers() {
	let foundUsers = await User.find();
	foundUsers.forEach((user) => {
		users[user._id] = null;
	});
}
getUsers(); */

const users = [];
io.on('connection', (socket) => {
	socket.on('connected', (id) => {
		users[id] = socket.id;
	});
	socket.on('message', async (data) => {
		const socketId = users[data.receiver];
		io.to(socketId).emit('message', {
			sender: data.sender,
			receiver: data.receiver,
			senderName: data.senderName,
			receiverName: data.receiverName,
			message: data.message,
		});

		const receiver = await User.findById(data.receiver);
		const sender = await User.findById(data.sender);

		if (!receiver || !sender) {
			return new ErrorResponse('Korisnik ne postoji', 404);
		}

		receiver.messages.push({
			sender: data.sender,
			receiver: data.receiver,
			senderName: data.senderName,
			receiverName: data.receiverName,
			message: data.message,
		});
		sender.messages.push({
			sender: data.sender,
			receiver: data.receiver,
			senderName: data.senderName,
			receiverName: data.receiverName,
			message: data.message,
		});

		receiver.save();
		sender.save();
		//return Promise.all(userReceiving, userSending);
	});
	socket.on('disconnect', () => {
		Object.entries(users).forEach((pair) => {
			if (socket.id === pair[1]) {
				delete users[pair[0]];
			}
		});
	});

	socket.on('typing', (data) => {
		io.to(users[data]).emit('typing');
	});
	socket.on('stopTyping', (data) => {
		io.to(users[data]).emit('stopTyping');
	});
});
