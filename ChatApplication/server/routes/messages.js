const router = require("express").Router();
const Message = require("../models/Message");
const auth = require("../auth"); // or "../middleware/auth"

// GET /messages/:roomId - chat history for a room
router.get("/:roomId", auth, async (req, res) => {
  try {
    const msgs = await Message.find({ roomId: req.params.roomId })
      .sort({ createdAt: 1 }); // oldest → newest
    res.json(msgs);
  } catch (err) {
    console.error("GET /messages error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
