const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const connectDB = require('./config/db');
const helemt = require('helmet');

// const File = require('./models/File');
// const Link = require('./models/Link');
const app = express();

connectDB();
app.use(cors());

app.use(express.json());
app.use(helemt());






// const testLink = new Link({
//     token: "secureToken123",
//     fileId: "679b483467ec633b3876bdc3",
//     passwordHash: "hashedPassword123",
//     expiresAt: ("2025-05-15T00:00:00.000Z"),
//     isOneTime: true,
//     used: false,
//     permissions: "view"

// });

// testLink.save()
//     .then(()=> console.log("Test Link saved successfully!!"))
//     .catch(err =>console.error("error saving test file", err));


// const testFile = new File({
//     fileId: "newFile143",
//     userId: new mongoose.Types.ObjectId(),
//     s3Key: "s3NewKey",
//     filename: "newFileName",
//     size: 14320117,
//     expiresAt: new Date("2025-04-12"), 
//     encryption: true
// });

// testFile.save()
//     .then(() => console.log("Test file saved successfully!"))
//     .catch(err => console.error("Error saving test file:", err));



const PORT = 3001
app.listen(PORT, ()=>{

    console.log(`Server running on port ${PORT}`)
});