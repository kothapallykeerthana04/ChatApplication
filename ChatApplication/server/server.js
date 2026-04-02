require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/rooms");
const messageRoutes = require("./routes/messages");
const uploadRoutes = require("./routes/upload");
const userRoutes = require("./routes/users");

const app = express();
const server = http.createServer(app);

// Connect Database
connectDB();

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));

// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/auth", authRoutes);
app.use("/rooms", roomRoutes);
app.use("/messages", messageRoutes);
app.use("/upload", uploadRoutes);
app.use("/users", userRoutes);

// Socket.io
const io = require("socket.io")(server, {
  cors: { origin: "http://localhost:3000" },
});

require("./socket")(io);

server.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`)
);
