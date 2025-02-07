const express = require("express")
const { uploadFile, deleteFile, renameFile } = require("../controllers/fileController");


const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");

const router = express.Router();

const upload = multer({storage: multer.memoryStorage() });

router.post("/upload", authMiddleware, upload.single("file"), uploadFile);
router.delete("/delete/:fileId", authMiddleware, deleteFile);
router.put("/rename/:fileId", authMiddleware, renameFile);

module.exports = router;
