const express = require('express');
const { body } = require('express-validator');

const ridesController = require('../controllers/ridesController');
const isAuth = require('../middleware/isAuth');
const Ride = require('../models/Ride');

const router = express.Router();

router.get('/', ridesController.getIndex);

router.get('/:id', ridesController.getUserRides);

router.post('/', isAuth, ridesController.postRide);

router.get('/user/:id', ridesController.getRide);

router.delete('/:id', isAuth, ridesController.deleteRide);

router.patch('/:id', isAuth, ridesController.updateRide);

module.exports = router;
