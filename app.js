const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

const errorHandler = require('./middleware/error');
const ridesRoutes = require('./routes/rides');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();

//middlewares

app.use(cors());

app.use(bodyParser.json());

app.use('/rides', ridesRoutes);
app.use('/auth', authRoutes);

app.use(errorHandler);

mongoose.connect(
	process.env.DB_URI,
	{ useNewUrlParser: true, useUnifiedTopology: true },
	(err) => {
		console.log(err);
	},
);

app.listen(3000);

//lesson 23
