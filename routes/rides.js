const express = require('express');

const ridesController = require('../controllers/ridesController');
const isAuth = require('../middleware/isAuth');

const router = express.Router();

router.get('/', isAuth, ridesController.getAllRides);

router.post('/', isAuth, ridesController.postRide);

router.post('/ride/:id', isAuth, ridesController.reserveRide);

router.put('/ride/:id', isAuth, ridesController.editRide);

router.patch('/ride/:id', isAuth, ridesController.removeUserFromRide);

router.delete('/ride/:id', isAuth, ridesController.deleteRide);

router.delete('/expired', isAuth, ridesController.deleteExpiredRides);

module.exports = router;
