const Message = require("./models/Message");
const User = require("./models/User");

module.exports = (io) => {
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // ✅ USER ONLINE
    socket.on("join-user", async (userId) => {
      socket.userId = userId;
      onlineUsers.set(userId, socket.id);

      await User.findByIdAndUpdate(userId, { online: true });

      io.emit("user-online-status", { userId, online: true });
    });

    // ✅ JOIN ROOM
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
    });

    // ✅ TYPING
    socket.on("typing", (roomId) => {
      socket.to(roomId).emit("typing", socket.userId);
    });

    // ✅ SEND MESSAGE
    socket.on("send-message", async (msg) => {
      try {
        const saved = await Message.create({
          roomId: msg.roomId,
          sender: socket.userId,
          text: msg.text || "",
          mediaUrl: msg.mediaUrl || null,
          mediaType: msg.mediaType || null,
          seenBy: [socket.userId],
        });

        io.to(msg.roomId).emit("receive-message", saved);
      } catch (err) {
        console.error(err);
      }
    });

    // ✅ SEEN
    socket.on("seen-message", async ({ messageId }) => {
      await Message.findByIdAndUpdate(messageId, {
        $addToSet: { seenBy: socket.userId },
      });
    });

    // ✅ DISCONNECT
    socket.on("disconnect", async () => {
      const userId = socket.userId;

      if (userId) {
        onlineUsers.delete(userId);

        await User.findByIdAndUpdate(userId, {
          online: false,
          lastSeen: new Date(),
        });

        io.emit("user-online-status", { userId, online: false });
      }

      console.log("User disconnected:", socket.id);
    });
  });
};