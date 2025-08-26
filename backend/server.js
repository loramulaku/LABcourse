require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile'); // rruget e profile

const app = express();
app.use(cors());
app.use(express.json());

// nuk krijojmë db këtu, do ta marrim nga db.js brenda routes

// rruget e auth (signup/login)
app.use('/api/auth', authRoutes);

// rruget e profile
app.use('/api/profile', profileRoutes);

// bëje uploads publik
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server po punon te porta ${PORT}`));
