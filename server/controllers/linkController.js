const Link = require('../models/Link');
const File = require('../models/File');
const supabase = require('../utils/supabase');
const bcrypt = require('bcryptjs');


exports.accessLink = async(req, res) =>{

    try{
        const {token} = req.params;
        const {password} = req.body;

        const link = await Link.findOne({ token });
        if (!link) return res.status(404).json({ error: "Invalid or expired link" });

        if (link.expiresAt && new Date() > link.expiresAt) {
            return res.status(403).json({ error: "Link has expired" });
          }


        if (link.isOneTime && link.used) {
            return res.status(403).json({ error: "This link has already been used" });
          }

        
          if (link.passwordHash) {
            const isMatch = await bcrypt.compare(password, link.passwordHash);
            if (!isMatch) return res.status(401).json({ error: "Incorrect password" });
          }

    const file = await File.findById(link.fileId);
    if (!file) return res.status(404).json({ error: "File not found" });


    console.log('File Supabase Key:', file.supabasePath);
      
    console.log(process.env.SUPABASE_BUCKET)

    const {data, error} = supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .getPublicUrl(file.supabasePath)

    if (error) {
      console.log("Error getting public URL:", error);
      return res.status(500).json({ error: "Failed to get public URL" });
    }

    if (link.isOneTime){
        link.used = true;
        await link.save()

    }

    console.log('File Supabase Key:', file.supabaseKey);
    console.log('Public URL:', data.publicUrl);

    
    res.status(200).json({
        message: "File access granted",
        url: data.publicUrl,
        permissions: link.permissions
      });



    }catch(err){

        console.err('Acces Error', err);
        res.status(500).json({error: "Failed to access file"});

    }
}