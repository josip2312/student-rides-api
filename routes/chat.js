const express = require('express');
const isAuth = require('../middleware/isAuth');
const chatController = require('../controllers/chatController');

const router = express.Router();

router.get('/:id', isAuth, chatController.getChats);

router.delete('/chat/:id', isAuth, chatController.deleteChat);

router.post('/chat/create', isAuth, chatController.createNewChat);

module.exports = router;
