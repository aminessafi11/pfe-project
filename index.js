require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const db = mysql.createConnection({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) { console.error('❌ MySQL connection failed:', err.message); return; }
  console.log('✅ Connected to MySQL database!');
  // Allow large profile pic data to be returned from MySQL
  db.query("SET SESSION max_allowed_packet = 67108864", () => {
    console.log('✅ MySQL packet size set to 64MB');
  });
});

const authRoutes    = require('./auth');
const adminRoutes   = require('./admin');
const chatRoutes    = require('./chat');
const reportRoutes  = require('./report');
const profileRoutes = require('./profile');

// ORDER MATTERS — specific routes before generic /api
app.use('/api/auth',    authRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api',         chatRoutes);
app.use('/api',         reportRoutes);

app.get('/', (req, res) => res.json({ message: 'Maklada backend is running!' }));

app.listen(process.env.PORT || 5000, () => console.log(`🚀 Server running on port ${process.env.PORT || 5000}`));