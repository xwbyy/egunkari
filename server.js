require('dotenv').config();
const express = require('express');
const path = require('express');
const cookieParser = require('cookie-parser');
const { auth } = require('./api/auth/callback');
const { verify } = require('./api/auth/verify');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Routes
app.post('/auth/callback', auth);
app.post('/auth/verify', verify);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/public/dashboard.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});