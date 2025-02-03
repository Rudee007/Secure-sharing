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

    const {publicURL, err} = supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .getPublicUrl(file.supabaseKey)
    
     if(err) throw err;



    if (link.isOneTime){
        link.used = true;
        await link.save()

    }
    
    res.status(200).json({
        message: "File access granted",
        url: publicURL,
        permissions: link.permissions
      });



    }catch(err){

        console.err('Acces Error', err);
        res.status(500).json({error: "Failed to access file"});

    }
}