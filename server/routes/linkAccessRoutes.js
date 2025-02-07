const express = require("express");
const router = express.Router();
const linkController = require("../controllers/linkController");

router.get("/access/:token", linkController.accessLink);

module.exports = router;
