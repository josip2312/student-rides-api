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
const chatRoutes = require('./routes/chat');

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
app.use('/', chatRoutes);

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
const port = process.env.PORT || 3000;

http.listen(port);

//chatting functionality with socket.io

const Chat = require('./models/Chat');

const rooms = [];
io.on('connection', (socket) => {
	socket.on('connected', async (data) => {
		rooms[data.room] = data.room;
		socket.join(data.room);
	});
	socket.on('message', async (data) => {
		socket.to(data.room).emit('message', data.message);

		//chat id
		const chat = await Chat.findById(data.room);

		chat.messages.push(data.message);

		await chat.save();
	});
});
