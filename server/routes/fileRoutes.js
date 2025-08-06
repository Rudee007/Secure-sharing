const express = require("express")
const { uploadFile, deleteFile, renameFile, getUserStorageUsage, getWeeklyActivity, getUserFiles, savePublicKey,getFileById } = require("../controllers/fileController");

const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");

const router = express.Router();

const upload = multer({storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), authMiddleware, uploadFile);
router.delete("/delete/:fileId", authMiddleware, deleteFile);
router.put("/rename/:fileId", authMiddleware, renameFile);
router.get('/storage-usage', authMiddleware, getUserStorageUsage);
router.get('/weekly-activity', authMiddleware, getWeeklyActivity);
router.get('/user-file',authMiddleware, getUserFiles);
router.get("/:fileId", authMiddleware, getFileById);


module.exports = router;
