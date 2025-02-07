const express = require("express");
const router = express.Router();
const linkGenerator = require("../controllers/linkGenerator");

router.post("/generate", linkGenerator.generateLink);

module.exports = router;
