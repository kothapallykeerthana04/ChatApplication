const Message = require("../models/Message");
const User = require("../models/User");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    socket.on("join-user", async (userId) => {
      socket.userId = userId;
      await User.findByIdAndUpdate(userId, { online: true });
      io.emit("user-online-status", { userId, online: true });
    });

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
    });

    socket.on("send-message", async (msg) => {
      // Save message to DB
      const saved = await Message.create({
        roomId: msg.roomId,
        sender: socket.userId,
        text: msg.text,
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType
      });

      io.to(msg.roomId).emit("receive-message", saved);
    });

    socket.on("disconnect", async () => {
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, { online: false });
        io.emit("user-online-status", { userId: socket.userId, online: false });
      }
    });
  });
};
