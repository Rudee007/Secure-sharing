const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const connectDB = require('./config/db');



const app = express();

connectDB();
app.use(cors());
app.use(express.json());

const PORT = 3001

app.listen(PORT, ()=>{

    console.log(`Server running on port ${PORT}`)
});