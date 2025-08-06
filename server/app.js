const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const linkAccessRoutes = require('./routes/linkAccessRoutes');
const linkGenerationRoutes = require('./routes/linkGenerationRoutes');

const app = express();

connectDB();
app.use(cors({
  origin: 'http://localhost:3000',
  allowedHeaders: ['Authorization', 'Content-Type'],
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json({ limit: '100mb' }));
app.use(helmet());

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/links', linkAccessRoutes);
app.use('/api/link', linkGenerationRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
  console.log(`Server running on port ${PORT}`);
});