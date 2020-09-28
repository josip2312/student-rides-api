const express = require('express');
const { body } = require('express-validator');

const ridesController = require('../controllers/ridesController');
const isAuth = require('../middleware/isAuth');
const Ride = require('../models/Ride');

const router = express.Router();

router.get('/', isAuth, ridesController.getAllRides);

router.post('/', isAuth, ridesController.postRide);

router.post('/ride/:id', isAuth, ridesController.reserveRide);

router.put('/ride/:id', isAuth, ridesController.editRide);

router.patch('/ride/update/:id', isAuth, ridesController.removeUserFromRide);

router.delete('/ride/:id', isAuth, ridesController.deleteRide);

router.delete('/expired', ridesController.deleteExpiredRides);

router.patch('/notifications', isAuth, ridesController.readNotification);

router.delete(
	'/notifications/:id',
	isAuth,
	ridesController.deleteAllNotifications,
);

module.exports = router;
