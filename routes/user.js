const express = require('express');
const router = express.Router();

const isAuth = require('../middleware/isAuth');

const userController = require('../controllers/userController');

router.get('/:id', isAuth, userController.getUser);

router.patch('/edit/:id', isAuth, userController.editUser);

router.patch(
	'/:id/photo',
	isAuth,

	userController.uploadUserPhoto,
);

router.patch('/notifications', isAuth, userController.readNotification);

router.delete(
	'/notifications/:id',
	isAuth,
	userController.deleteAllNotifications,
);

module.exports = router;
