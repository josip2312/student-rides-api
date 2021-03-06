const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const fileupload = require('express-fileupload');

const compression = require('compression');
const helmet = require('helmet');

const errorHandler = require('./middleware/error');
const ridesRoutes = require('./routes/rides');
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

dotenv.config();

const app = express();
const server = require('http').createServer(app);

const io = require('socket.io')(server);

//middlewares
app.use(cors());
app.use(bodyParser.json());
app.disable('x-powered-by');

app.use(compression());
app.use(helmet());

//file upload
app.use(fileupload());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/rides', ridesRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/chats', chatRoutes);

app.use(errorHandler);

mongoose.connect(
	process.env.MONGODB_URI,
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true,
	},
	(err) => {
		console.log('Connected');
		if (err) {
			console.log(err);
		}
	},
);
const port = process.env.PORT || 3000;

server.listen(port);

//chatting functionality with socket.io

const Chat = require('./models/Chat');

const rooms = {};
const users = {};

io.on('connection', (socket) => {
	socket.on('connectedGlobal', async (data) => {
		users[data.id] = socket.id;
	});

	socket.on('connectedRoom', async (data) => {
		rooms[data.room] = data.room;
		socket.join(data.room);
	});

	socket.on('message', async (data) => {
		io.to(data.room).emit('message', data.message);

		socket
			.to(users[data.message.receiver])
			.emit('notification', `Nova poruka od ${data.message.from}`);

		const chat = await Chat.findById(data.room);
		chat.messages.push(data.message);
		chat.save();
	});

	socket.on('typing', async (data) => {
		socket.to(data).emit('typing');
	});

	socket.on('stopTyping', async (data) => {
		socket.to(data).emit('stopTyping');
	});

	socket.on('readMessages', async (data) => {
		const chat = await Chat.findById(data.room);

		if (chat.messages.length > 0) {
			if (
				chat.messages[chat.messages.length - 1].sender !== data.sender
			) {
				chat.messages[chat.messages.length - 1].receiverHasRead = true;

				await chat.save(function (err) {
					if (err) {
						console.log(err);
					}
				});
			}
		}
	});
	socket.on('clearNotifications', (data) => {
		io.to(users[data.sender]).emit('clearNotification');
	});
});
