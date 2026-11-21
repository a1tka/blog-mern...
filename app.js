require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Make sure DB is connected before any API route runs
app.use('/api', async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found' }));

// Static frontend (used when running locally; Vercel serves /public itself)
app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;
