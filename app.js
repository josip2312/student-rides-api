const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const ridesRoutes = require('./routes/rides');
const authRoutes = require('./routes/auth');

const dotenv = require('dotenv');

dotenv.config();

const app = express();

//middlewares

app.use(cors());

app.use(bodyParser.json());

app.use('/rides', ridesRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
	const status = error.statusCode || 500;
	const message = error.message;
	const data = error.data;
	res.status(status).json({ message, data });
});

mongoose.connect(
	process.env.DB_URI,
	{ useNewUrlParser: true, useUnifiedTopology: true },
	(err) => {
		console.log(err);
	},
);

app.listen(3000);

//lesson 23
