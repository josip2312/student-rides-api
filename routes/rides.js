const express = require('express');
const { body } = require('express-validator');

const ridesController = require('../controllers/ridesController');
const isAuth = require('../middleware/isAuth');
const Ride = require('../models/Ride');

const router = express.Router();

router.get('/', ridesController.getAllRides);

router.get('/user/:id', ridesController.getUserRides);

router.get('/user/reserved/:id', ridesController.getReservedRides);

router.post('/', isAuth, ridesController.postRide);

router.get('/:id', ridesController.getSingleRide);

router.post('/ride/:id', ridesController.reserveRide);

router.patch('/ride/:id', isAuth, ridesController.updateRide);

router.delete('/ride/:id', isAuth, ridesController.deleteRide);

router.put('/notifications', isAuth, ridesController.readNotification);

router.delete(
	'/notifications/:id',
	isAuth,
	ridesController.deleteAllNotifications,
);

module.exports = router;
