const express = require("express");
const auth = require("../middleware/auth");
const { follow } = require("../controllers/follow");

const router = express.Router();
//
router.route("/").put(auth, follow);
module.exports = router;
