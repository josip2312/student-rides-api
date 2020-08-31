const express = require('express');

const chatController = require('../controllers/chatController');

const Ride = require('../models/Ride');

const router = express.Router();

router.get('/chat/:id', chatController.getChats);

router.post('/chat/create', chatController.createNewChat);

module.exports = router;
