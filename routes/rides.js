const express = require('express');
const { body } = require('express-validator');

const ridesController = require('../controllers/ridesController');
const isAuth = require('../middleware/isAuth');
const Ride = require('../models/Ride');

const router = express.Router();

router.get('/', isAuth, ridesController.getAllRides);

router.get('/user/:id', isAuth, ridesController.getUserRides);

router.get('/user/reserved/:id', ridesController.getReservedRides);

router.post('/', isAuth, ridesController.postRide);

router.get('/:id', isAuth, ridesController.getSingleRide);

router.post('/ride/:id', isAuth, ridesController.reserveRide);

router.patch('/ride/:id', isAuth, ridesController.editRide);

router.patch('/ride/update/:id', isAuth, ridesController.removeUserFromRide);

router.delete('/ride/:id', isAuth, ridesController.deleteRide);

router.delete('/expired', ridesController.deleteExpiredRides);

router.put('/notifications', isAuth, ridesController.readNotification);

router.delete(
	'/notifications/:id',
	isAuth,
	ridesController.deleteAllNotifications,
);

module.exports = router;
