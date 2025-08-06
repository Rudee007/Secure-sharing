const express = require("express");
const router = express.Router();
const {accessFile, confirmDownload, getUserLinks} = require("../controllers/linkController");
const authMiddleware = require("../middleware/authMiddleware");
router.route("/share/:token")
  .get(accessFile)   
  .post(accessFile);

router.post("/confirm-download/:token", confirmDownload);
router.get("/user", authMiddleware, getUserLinks);

module.exports = router;
