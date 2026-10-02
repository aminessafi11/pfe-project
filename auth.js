require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');

const db = mysql.createConnection({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
db.connect();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const JWT_SECRET = process.env.JWT_SECRET;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validatePassword(password) {
  if (!password || password.length < 6)
    return 'Password must be at least 6 characters.';
  if (!/[a-zA-Z]/.test(password))
    return 'Password must contain at least one letter.';
  if (!/[0-9]/.test(password))
    return 'Password must contain at least one number.';
  return null;
}

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query(
    'SELECT * FROM users WHERE username = ? OR email = ?',
    [username, username],
    async (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (results.length === 0)
        return res.status(401).json({ message: 'Invalid username or password' });
      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(401).json({ message: 'Invalid username or password' });
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '8h' }
      );
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
        },
      });
    }
  );
});

router.post('/change-password', (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  if (!userId || !currentPassword || !newPassword)
    return res.status(400).json({ message: 'All fields are required' });

  const pwError = validatePassword(newPassword);
  if (pwError) return res.status(400).json({ message: pwError });

  db.query('SELECT * FROM users WHERE id = ?', [userId], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = results[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId], (updateErr) => {
      if (updateErr) return res.status(500).json({ message: 'Server error' });
      res.json({ message: 'Password changed successfully' });
    });
  });
});

router.post('/update-info', (req, res) => {
  const { userId, newUsername, newEmail, newFirstName, newLastName, newPhone } = req.body;
  if (!userId) return res.status(400).json({ message: 'Missing userId' });

  if (newEmail != null && newEmail !== '') {
    if (!emailRegex.test(newEmail))
      return res.status(400).json({ message: 'Please enter a valid email address (e.g. user@company.com)' });
  }

  const updates = [], values = [];
  if (newUsername  != null) { updates.push('username = ?');   values.push(newUsername); }
  if (newEmail     != null) { updates.push('email = ?');      values.push(newEmail); }
  if (newFirstName != null) { updates.push('first_name = ?'); values.push(newFirstName || null); }
  if (newLastName  != null) { updates.push('last_name = ?');  values.push(newLastName  || null); }
  if (newPhone     != null) { updates.push('phone = ?');      values.push(newPhone     || null); }

  if (!updates.length) return res.status(400).json({ message: 'Nothing to update' });
  values.push(userId);

  db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values, (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        if (err.message.includes('phone'))
          return res.status(400).json({ message: 'This phone number is already used by another account.' });
        return res.status(400).json({ message: 'Username or email already taken' });
      }
      return res.status(500).json({ message: 'Server error' });
    }
    res.json({ message: 'Info updated successfully' });
  });
});

router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  if (!emailRegex.test(email))
    return res.status(400).json({ message: 'Please enter a valid email address' });

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length === 0) return res.status(404).json({ message: 'Email not found' });
    const user = results[0];
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = new Date(Date.now() + 3600000);
    db.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [resetCode, resetExpires, user.id],
      async (updateErr) => {
        if (updateErr) return res.status(500).json({ message: 'Server error' });
        try {
          await transporter.sendMail({
            from: `"Maklada App" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Maklada Password Reset Code',
            html: `<div style="font-family:Arial,sans-serif;padding:20px;">
              <h2 style="color:#2563eb;">Reset Your Password</h2>
              <p>Your reset code is:</p>
              <div style="background:#f3f4f6;padding:20px;border-radius:8px;text-align:center;margin:16px 0;">
                <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#2563eb;">${resetCode}</span>
              </div>
              <p>This code expires in <strong>1 hour</strong>.</p>
            </div>`,
          });
          res.json({ message: 'Reset code sent to your email!' });
        } catch (emailErr) {
          res.status(500).json({ message: 'Failed to send email' });
        }
      }
    );
  });
});

router.post('/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword)
    return res.status(400).json({ message: 'All fields are required' });

  const pwError = validatePassword(newPassword);
  if (pwError) return res.status(400).json({ message: pwError });

  db.query(
    'SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()',
    [email, code],
    async (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (results.length === 0)
        return res.status(400).json({ message: 'Invalid or expired code' });
      const user = results[0];
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      db.query(
        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
        [hashedPassword, user.id],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ message: 'Server error' });
          res.json({ message: 'Password reset successfully!' });
        }
      );
    }
  );
});

module.exports = router;