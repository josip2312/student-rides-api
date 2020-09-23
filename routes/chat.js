const express = require('express');
const isAuth = require('../middleware/isAuth');
const chatController = require('../controllers/chatController');
const Ride = require('../models/Ride');

const router = express.Router();

router.get('/chat/:id', isAuth, chatController.getChats);

router.delete('/chat/:id', isAuth, chatController.deleteChat);

router.post('/chat/create', isAuth, chatController.createNewChat);

module.exports = router;
