const bcrypt = require('bcryptjs');
const Link = require('../models/Link');
const File = require('../models/File');
const User = require('../models/User');


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
exports.accessFile = async (req, res) => {
  try {
    const { token } = req.params;
    const link = await Link.findOne({ token }).populate('fileId');

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'Link has expired' });
    }

    if (link.passwordHash && !req.body.password) {
      return res.status(401).json({ error: 'Password required' });
    }

    if (link.passwordHash) {
      const isValid = await bcrypt.compare(req.body.password, link.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    const file = link.fileId;
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fileInfo = {
      filename: file.filename,
      size: file.size,
      mimeType: file.mimeType || getMimeTypeFromFilename(file.filename),
      url: file.url,
      viewUrl: file.url,
      downloadUrl: file.url,
      encryption: file.encryption,
      permissions: link.permissions,
      isOneTimeDownload: link.isOneTimeDownload
    };

    if (file.encryption) {
      fileInfo.encryptedKey = file.encryptedKey;
      fileInfo.iv = file.iv;
    }

    res.status(200).json(fileInfo);
  } catch (err) {
    console.error('Access error:', err.stack);
    res.status(500).json({ error: err.message || 'Failed to access file please try again.' });
  }
};


exports.confirmDownload = async (req, res) => {
  try {
    const { token } = req.params;
    const link = await Link.findOne({ token });
    if (!link) {
      return res.status(404).json({ error: "Invalid link" });
    }
    if (!link.isOneTimeDownload) {
      return res.status(400).json({ error: "This link is not a one-time download link" });
    }
    if (link.used) {
      return res.status(403).json({ error: "This link has already been used" });
    }

    // Mark the link as used and update permissions to "View Only"
    link.used = true;
    link.permissions = "View Only";
    await link.save();

    res.status(200).json({ message: "Download confirmed and link updated to View Only" });
  } catch (err) {
    console.error('Confirm Download Error:', err);
    res.status(500).json({ error: "Failed to confirm download" });
  }
};



exports.getUserLinks = async (req, res) => {
  try {
    const userId = req.user?._id;
    console.log("Fetching links for userId:", userId);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const links = await Link.find({ userId }).populate('fileId');
    if (!links || links.length === 0) {
      return res.status(404).json({ error: 'No shared links found for this user' });
    }

    const fileInfoList = links
      .filter(link => link.fileId !== null)
      .map(link => {
        const file = link.fileId;
        return {
          token: link.token,
          fileId: file._id,
          filename: file.filename,
          size: file.size,
          viewUrl: file.url,
          downloadUrl: file.url,
          encryption: file.encryption || false,
          iv: file.iv || null,
          permissions: link.permissions,
          isOneTimeDownload: link.isOneTimeDownload,
          expiresAt: link.expiresAt,
          createdAt: link.createdAt,
          sharedBy: 'You'
        };
      });

    return res.status(200).json(fileInfoList);
  } catch (err) {
    console.error('Get user links error:', err.stack);
    return res.status(500).json({ error: 'Failed to fetch user links' });
  }
};