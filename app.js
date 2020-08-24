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

app.listen(3000);

//lesson 23
