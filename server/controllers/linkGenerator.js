const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const Link = require('../models/Link');


exports.generateLink = async (req,res) =>{

    try{
        const { fileId, expiresAt, isOneTime, isOneTimeDownload, password, permissions } = req.body;

        const token = uuidv4();

        const passwordHash = password ? await bcrypt.hash(password, 10) : null;

        const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ error: "File not found" });


    await Link.create({
        token,
        fileId: file._id,
        passwordHash,
        expiresAt,
        isOneTime,
        isOneTimeDownload,
        permissions,
      });


      res.status(201).json({
        message: "Link generated successfully",
        link: `${process.env.FRONTEND_URL}/access/${token}`
    });



    } catch(e){

        console.error("Link generation error: ", err);
        res.status(500).json({error: "Failed to generate link"});
        
    }
};