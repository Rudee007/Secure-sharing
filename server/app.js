const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const connectDB = require('./config/db');
const helemt = require('helmet');

const authRoutes = require('./routes/authRoutes')
const fileRoutes = require('./routes/fileRoutes');
const linkAccessRoutes = require("./routes/linkAccessRoutes");
const linkGenerationRoutes = require("./routes/linkGenerationRoutes");


const app = express();

connectDB();
app.use(cors());

app.use(express.json());
app.use(helemt());



app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/links',linkAccessRoutes);
app.use('/api/links',linkGenerationRoutes);





const PORT = 3001
app.listen(PORT, ()=>{

    console.log(`Server running on port ${PORT}`)
});