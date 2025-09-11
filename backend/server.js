require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Importo rruget
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const usersRoutes = require('./routes/users');
const adminProfileRoutes = require('./routes/adminProfile'); 
const doctorRoutes = require("./routes/doctorRoutes");

const app = express();

// CORS – lejo origin + credentials + Authorization header
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // ✅
  })
);

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cookie parser
app.use(cookieParser());

// Rrugët kryesore
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin-profiles', adminProfileRoutes); 
app.use("/api/doctors", doctorRoutes);

// bëj folderin uploads publik
const path = require('path');
const fs = require('fs');
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server po punon në portën ${PORT}`));