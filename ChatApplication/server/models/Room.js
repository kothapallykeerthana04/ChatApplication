const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    isPublic: { type: Boolean, default: true },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", RoomSchema);
