const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const Link = require('../models/Link');
const File = require('../models/File');
const User = require('../models/User');
const crypto = require('crypto');

exports.generateLink = async (req, res) => {
  try {
    const {
      fileId,
      expiresAt,
      isOneTimeDownload,
      password,
      permissions,
      isE2EE
    } = req.body;

    const file = await File.findOne({ fileId });
    if (!file) return res.status(404).json({ error: 'File not found' });

    const token = crypto.randomBytes(20).toString('hex');

    let encryptedSymmetricKey = null;
    let iv = null;

    if (isE2EE) {

      encryptedSymmetricKey = encodeURIComponent(file.encryptedKey);
      iv = encodeURIComponent(file.iv);
    }

    const newLink = new Link({
      token,
      fileId: file._id,
      userId: file.userId,
      expiresAt,
      isOneTimeDownload,
      passwordHash: password ? await bcrypt.hash(password, 10) : null,
      permissions,
      isE2EE,
      iv: iv ? decodeURIComponent(iv) : null,
      encryptedSymmetricKey: encryptedSymmetricKey ? decodeURIComponent(encryptedSymmetricKey) : null,
    });

    await newLink.save();

    const baseURL = `${process.env.FRONTEND_URL}/share/${token}`;
    const fullLink = isE2EE
      ? `${baseURL}?iv=${iv}&key=${encryptedSymmetricKey}`
      : baseURL;

    res.status(201).json({
      message: 'Link generated successfully',
      link: fullLink,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate link' });
  }
};
