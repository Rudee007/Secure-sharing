const supabase = require('../utils/supabase');
const File = require('../models/File');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');


const getMimeTypeFromFilename = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  };
  return mimeTypes[extension] || 'application/octet-stream';
};

exports.uploadFile = async (req, res) => {
  try {
    console.log('Request headers:', req.headers);
    console.log('Request file:', req.file);

    const { encrypt, encryptedKey, iv, filename: clientFilename } = req.body;
    const isEncrypted = encrypt === 'true';
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Missing file' });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID missing' });
    }

    const fileBuffer = file.buffer;
    const fileId = uuidv4();
    const originalFilename = clientFilename || file.originalname; // Use client-provided filename or fallback to original
    const filename = isEncrypted ? `${originalFilename}.enc` : originalFilename; // Add .enc only if encrypted
    const filePath = `${userId}/${fileId}${isEncrypted ? '.enc' : ''}`;
    const mimeType = file.mimetype || getMimeTypeFromFilename(filename);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(filePath, fileBuffer, { contentType: mimeType });
    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new Error('Failed to upload file to storage: ' + uploadError.message);
    }

    const { data: publicData, error: publicError } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(filePath);
    if (publicError) {
      console.error('Supabase URL error:', publicError);
      throw new Error('Failed to get public URL: ' + publicError.message);
    }
    const publicUrl = publicData.publicUrl;

    if (isEncrypted && (!encryptedKey || !iv)) {
      return res.status(400).json({ error: 'Missing encryption metadata (encryptedKey or iv)' });
    }

    const fileData = {
      fileId,
      userId,
      supabaseKey: filePath,
      filename,
      size: fileBuffer.length,
      mimeType,
      supabasePath: uploadData?.path,
      url: publicUrl,
      encryption: isEncrypted,
      createdAt: new Date(),
    };

    if (isEncrypted) {
      fileData.encryptedKey = encryptedKey;
      fileData.iv = iv;
    }

    await File.create(fileData);

    res.status(201).json({
      message: 'File uploaded successfully!',
      fileId,
      url: publicUrl,
      mimeType
    });
  } catch (err) {
    console.error('Upload error:', err.stack);
    res.status(500).json({ error: err.message || 'File upload failed' });
  }
};


exports.getFileById = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findOne({ fileId });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Infer mimeType from filename extension
    const getMimeTypeFromFilename = (filename) => {
      const extension = filename.split('.').pop().toLowerCase();
      const mimeTypes = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'zip': 'application/zip',
        'rar': 'application/x-rar-compressed'
      };
      return mimeTypes[extension] || 'application/octet-stream';
    };

    const mimeType = getMimeTypeFromFilename(file.filename);

    // Return all necessary fields for AccessFile.js
    res.status(200).json({
      fileId: file.fileId,
      filename: file.filename,
      size: file.size,
      url: file.url,
      encryption: file.encryption || false,
      encryptedKey: file.encryptedKey || null,
      iv: file.iv || null,
      createdAt: file.createdAt,
      mimeType // Dynamically added mimeType
    });
  } catch (err) {
    console.error('Error fetching file details:', err.stack);
    res.status(500).json({ error: 'Failed to fetch file details' });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user?._id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const file = await File.findOne({ fileId, userId: userObjectId });
    if (!file) return res.status(404).json({ error: 'File not found' });

    console.log('Removing file from Supabase:', [file.supabasePath]);
    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .remove([file.supabasePath]);
    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error('Failed to delete file from storage: ' + error.message);
    }

    await File.deleteOne({ fileId, userId: userObjectId });
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err.stack);
    res.status(500).json({ error: err.message || 'File deletion failed' });
  }
};

exports.renameFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { newFilename } = req.body;
    const userId = req.user?._id;

    if (!newFilename) return res.status(400).json({ error: 'New filename is required' });
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await File.findOne({ fileId, userId });
    if (!file) return res.status(404).json({ error: 'File not found' });

    const isEncrypted = file.encryption;
    const newFilePath = `${userId}/${uuidv4()}${isEncrypted ? '.enc' : ''}`;

    console.log(`Copying ${file.supabasePath} to ${newFilePath}`);
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .copy(file.supabasePath, newFilePath);
    if (error) {
      console.error('Supabase copy error:', error);
      throw new Error('Failed to copy file: ' + error.message);
    }

    console.log('Removing old file:', file.supabasePath);
    await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .remove([file.supabasePath]);

    const { data: publicData, error: urlError } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(newFilePath);
    if (urlError) {
      console.error('Supabase URL error:', urlError);
      throw new Error('Failed to get new public URL: ' + urlError.message);
    }

    file.filename = newFilename;
    file.supabasePath = newFilePath;
    file.url = publicData.publicUrl;
    await file.save();

    res.status(200).json({ message: 'File renamed successfully', newFilename, url: file.url });
  } catch (err) {
    console.error('Rename error:', err.stack);
    res.status(500).json({ error: err.message || 'File rename failed' });
  }
};

exports.getUserStorageUsage = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const result = await File.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, totalSize: { $sum: '$size' }, fileCount: { $sum: 1 } } }
    ]);

    const totalSize = result.length > 0 ? result[0].totalSize : 0;
    const fileCount = result.length > 0 ? result[0].fileCount : 0;
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    return res.status(200).json({
      totalSize,
      totalSizeMB: sizeMB,
      fileCount
    });
  } catch (err) {
    console.error('Storage calculation error:', err.stack);
    res.status(500).json({ error: err.message || 'Failed to calculate storage usage' });
  }
};

exports.getWeeklyActivity = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyData = await File.aggregate([
      {
        $match: {
          userId: userObjectId,
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          uploads: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          dayNumber: '$_id',
          uploads: 1
        }
      }
    ]);

    const dayMap = { 1: 'Sun', 2: 'Mon', 3: 'Tue', 4: 'Wed', 5: 'Thu', 6: 'Fri', 7: 'Sat' };
    const formattedData = weeklyData.map(entry => ({
      day: dayMap[entry.dayNumber],
      uploads: entry.uploads
    }));

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const fullWeekData = daysOfWeek.map(day => {
      const dayData = formattedData.find(d => d.day === day);
      return { day, uploads: dayData ? dayData.uploads : 0 };
    });

    return res.status(200).json(fullWeekData);
  } catch (err) {
    console.error('Weekly activity error:', err.stack);
    res.status(500).json({ error: err.message || 'Failed to fetch weekly activity' });
  }
};

exports.getUserFiles = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const files = await File.find({ userId: userObjectId }).sort({ createdAt: -1 });

    res.status(200).json(files);
  } catch (err) {
    console.error('Error fetching user files:', err.stack);
    res.status(500).json({ error: err.message || 'Failed to fetch user files' });
  }
};