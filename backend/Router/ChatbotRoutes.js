// routes/chatbotRoutes.js
const express = require("express");
const router = express.Router();
const { chatbotChat } = require("../Controller/chatbotController");
// const auth = require("../Middleware/auth"); // same as other protected routes

router.post("/chat", chatbotChat);

module.exports = router;
