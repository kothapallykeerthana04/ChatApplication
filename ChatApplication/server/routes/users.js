const router = require("express").Router();
const User = require("../models/User");
const auth = require("../auth");

// Get all users
router.get("/", auth, async (req, res) => {
  const users = await User.find({}, { password: 0 });
  res.json(users);
});

module.exports = router;
