const express = require("express");
const auth = require("../middleware/auth");
const {
  PhotoUpload,
  getMyPhotos,
  updatePhoto,
  deletePhoto,
  getFriendsPost,
} = require("../controllers/photo");

const router = express.Router();

router.route("/photo").put(auth, PhotoUpload).get(auth, getFriendsPost);
router.route("/me").get(auth, getMyPhotos);
router.route("/:photo_id").put(auth, updatePhoto).delete(auth, deletePhoto);
module.exports = router;
