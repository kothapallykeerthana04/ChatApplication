const router = require("express").Router();
const Room = require("../models/Room");
const User = require("../models/User");
const Message = require("../models/Message");
const auth = require("../auth"); // adjust to "../middleware/auth" if you use that

// GET /rooms - all public rooms + rooms this user is in
router.get("/", auth, async (req, res) => {
  try {
    // public groups
    const publicRooms = await Room.find({ isPublic: true });

    // rooms user already joined (DMs + groups)
    const myRooms = await Room.find({ participants: req.userId });

    // merge, de-duplicate by _id
    const all = [...publicRooms, ...myRooms];
    const unique = Array.from(new Map(all.map((r) => [r._id.toString(), r])).values());

    res.json(unique);
  } catch (err) {
    console.error("GET /rooms error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /rooms - create a PUBLIC group room
router.post("/", auth, async (req, res) => {
  try {
    const { name } = req.body;

    const room = await Room.create({
      name,
      isPublic: true,             // 👈 group
      participants: [req.userId], // creator is member
    });

    res.json(room);
  } catch (err) {
    console.error("POST /rooms error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /rooms/private - create or get a DM
router.post("/private", auth, async (req, res) => {
  try {
    const { otherUserId } = req.body;

    // find existing DM
    let room = await Room.findOne({
      isPublic: false,
      participants: { $all: [req.userId, otherUserId], $size: 2 },
    });

    if (!room) {
      const me = await User.findById(req.userId);
      const other = await User.findById(otherUserId);

      room = await Room.create({
        name: `${me.username} & ${other.username}`,
        isPublic: false,
        participants: [req.userId, otherUserId],
      });
    }

    res.json(room);
  } catch (err) {
    console.error("POST /rooms/private error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /rooms/join - join a PUBLIC room by clicking it
router.post("/join", auth, async (req, res) => {
  try {
    const { roomId } = req.body;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });

    if (!room.isPublic)
      return res.status(403).json({ error: "Not a public room" });

    if (!room.participants.includes(req.userId)) {
      room.participants.push(req.userId);
      await room.save();
    }

    res.json(room);
  } catch (err) {
    console.error("POST /rooms/join error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /rooms/:roomId - delete a room (any participant, since no admins)
router.delete("/:roomId", auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });

    if (!room.participants.includes(req.userId)) {
      return res.status(403).json({ error: "You are not in this room" });
    }

    await Message.deleteMany({ roomId: room._id });
    await room.deleteOne();

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /rooms/:roomId error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
