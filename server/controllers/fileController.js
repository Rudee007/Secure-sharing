const supabase = require('../utils/supabase');
const File = require('../models/File');
const { v4: uuidv4 } = require('uuid');


exports.uploadFile = async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID missing' });
    }

    const fileId = uuidv4();
    const filePath = `${userId}/${fileId}`;

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) throw error;

    const { publicURL, error: urlError } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(filePath);

    if (urlError) throw urlError;

    await File.create({
      fileId,
      userId,
      filename: file.originalname,
      size: file.size,
      supabasePath: data?.path,
      url: publicURL,
    });

    res.status(201).json({ message: 'File uploaded successfully!', fileId, url: publicURL });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'File upload failed' });
  }
};


exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await File.findOne({ fileId, userId });
    if (!file) return res.status(404).json({ error: 'File not found' });

 
    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .remove([file.supabasePath]);

    if (error) throw error;

   
    await File.deleteOne({ fileId, userId });

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message || 'File deletion failed' });
  }
};


exports.renameFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { newFilename } = req.body;
    const userId = req.user?.id;
    
    if (!newFilename) return res.status(400).json({ error: 'New filename is required' });
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await File.findOne({ fileId, userId });
    if (!file) return res.status(404).json({ error: 'File not found' });

    const newFilePath = `${userId}/${uuidv4()}`;

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .copy(file.supabasePath, newFilePath);

    if (error) throw error;

    await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .remove([file.supabasePath]);

    const { publicURL, error: urlError } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(newFilePath);

    if (urlError) throw urlError;

    file.filename = newFilename;
    file.supabasePath = newFilePath;
    file.url = publicURL;
    await file.save();

    res.status(200).json({ message: 'File renamed successfully', newFilename, url: publicURL });
  } catch (err) {
    console.error('Rename error:', err);
    res.status(500).json({ error: err.message || 'File rename failed' });
  }
};
