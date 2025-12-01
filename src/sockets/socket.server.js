const { Server } = require("socket.io");
const cookie = require("cookie");
const JWT = require("jsonwebtoken");
const userModel = require("../models/user.model");
const generateResponse = require("../services/ai.service");
const messageModel = require('../models/message.model')

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  //Socket Middleware
  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

    if (!cookies) {
      next(new Error("Authentication failed for server with invalid cookies"));
    }

    try {
      const decoded = JWT.verify(cookies.token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded.id);
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication failed: " + error.message));
    }
  });

  // Connect to the server and AI Integration
  io.on("connection", (socket) => {
    socket.on("ai-message", async (messagePayload) => {
      const response = await generateResponse(messagePayload.content);

      socket.emit("ai-response", {
        cntent: response,
        chat: messagePayload.chat,
      });
    });
  });
}

module.exports = initSocketServer;
