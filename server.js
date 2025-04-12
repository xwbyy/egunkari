require('dotenv').config();
const express = require('express');
const path = require('path'); // Diperbaiki dari 'express' ke 'path'
const cookieParser = require('cookie-parser');
const { auth } = require('./api/auth/callback');
const { verify } = require('./api/auth/verify');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.post('/auth/callback', auth);
app.post('/auth/verify', verify);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

module.exports = app;