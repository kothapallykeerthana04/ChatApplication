const router = require("express").Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Register
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password: hash
  });

  res.json(user);
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const u = await User.findOne({ email });
  if (!u) return res.status(404).json({ error: "User not found" });

  const match = await bcrypt.compare(password, u.password);
  if (!match) return res.status(400).json({ error: "Wrong password" });

  const token = jwt.sign({ userId: u._id }, process.env.JWT_SECRET);

  res.json({
    token,
    user: { id: u._id, username: u.username, email: u.email, online: u.online }
  });
});

module.exports = router;
