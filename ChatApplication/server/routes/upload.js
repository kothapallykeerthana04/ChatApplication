const router = require("express").Router();
const multer = require("multer");
const auth = require("../auth");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

router.post("/", auth, upload.single("file"), (req, res) => {
  res.json({
    url: "/uploads/" + req.file.filename,
    type: req.file.mimetype
  });
});

module.exports = router;
