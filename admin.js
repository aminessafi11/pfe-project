require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
db.connect();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const emailRegex    = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const usernameRegex = /^[a-zA-Z0-9._-]{3,30}$/;

function sendUserInfoEmail({ to, subject, name, infoRows, note, approved }) {
  const color      = approved ? '#16a34a' : '#dc2626';
  const statusText = approved
    ? 'Your request has been APPROVED ✓'
    : 'Your request has been REJECTED ✗';
  const rowsHtml = infoRows.map(([label, value, changed]) => `
    <tr style="background:${changed ? (approved ? '#f0fdf4' : '#fff7f7') : '#f9fafb'}">
      <td style="padding:10px 14px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">${label}</td>
      <td style="padding:10px 14px;color:#111827;border-bottom:1px solid #e5e7eb;">
        ${value}${changed ? ` <span style="font-size:11px;color:${color};font-weight:700;">(updated)</span>` : ''}
      </td>
    </tr>`).join('');

  return transporter.sendMail({
    from: `"Maklada App" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
        <div style="background:#1A2F4A;padding:24px;border-radius:12px 12px 0 0;">
          <h2 style="color:#5BAEE0;margin:0 0 4px;">MAKLADA PFE PROJECT</h2>
          <p style="color:#a8cce0;margin:0;font-size:13px;">Account Update Notification</p>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
          <p style="color:#374151;">Hello <strong>${name}</strong>,</p>
          <div style="background:${approved ? '#f0fdf4' : '#fef2f2'};border:1px solid ${color};border-radius:8px;padding:12px 16px;margin:16px 0;">
            <p style="color:${color};font-weight:700;margin:0;">${statusText}</p>
            ${note ? `<p style="color:#374151;margin:8px 0 0;font-size:13px;">Admin note: <em>${note}</em></p>` : ''}
          </div>
          <p style="color:#374151;font-size:13px;">Your current account information:</p>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            ${rowsHtml}
          </table>
          <p style="color:#9ca3af;font-size:11px;margin-top:20px;text-align:center;">
            MAKLADA PFE PROJECT — Industrial Maintenance BI Portal
          </p>
        </div>
      </div>`,
  });
}

// ── Create new account (user or admin) ────────────────────────────────────────
router.post('/create-user', async (req, res) => {
  const { username, email, firstName, lastName, phone, role } = req.body;

  if (!username || !email || !firstName || !lastName)
    return res.status(400).json({ message: 'First name, last name, username and email are all required' });

  if (!emailRegex.test(email))
    return res.status(400).json({ message: 'Please enter a valid email address (e.g. user@company.com)' });

  if (!usernameRegex.test(username))
    return res.status(400).json({ message: 'Username must be 3-30 characters: letters, numbers, dots, dashes or underscores only' });

  const assignedRole   = role === 'admin' ? 'admin' : 'user';
  const randomPassword = Math.random().toString(36).slice(-8) + 'M1!';
  const hashedPassword = await bcrypt.hash(randomPassword, 10);

  db.query(
    `INSERT INTO users (username, first_name, last_name, phone, email, password, role)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [username, firstName, lastName, phone || null, email, hashedPassword, assignedRole],
    async (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          if (err.message.includes('phone'))
            return res.status(400).json({ message: 'This phone number is already used by another account.' });
          return res.status(400).json({ message: 'Username or email already exists' });
        }
        return res.status(500).json({ message: 'Server error: ' + err.message });
      }

      try {
        const fullName = [firstName, lastName].join(' ');
        await transporter.sendMail({
          from: `"Maklada App" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Welcome to Maklada — Your Account Credentials',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
              <div style="background:#1A2F4A;padding:24px;border-radius:12px 12px 0 0;">
                <h2 style="color:#5BAEE0;margin:0 0 4px;">MAKLADA PFE PROJECT</h2>
                <p style="color:#a8cce0;margin:0;font-size:13px;">Your account has been created</p>
              </div>
              <div style="padding:24px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
                <p style="color:#374151;">Hello <strong>${firstName}</strong>,</p>
                <p style="color:#374151;font-size:13px;">Your account has been created. Here are your details:</p>
                <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                  <tr style="background:#f9fafb">
                    <td style="padding:10px 14px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Full Name</td>
                    <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">${fullName}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 14px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Username</td>
                    <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">${username}</td>
                  </tr>
                  <tr style="background:#f9fafb">
                    <td style="padding:10px 14px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Email</td>
                    <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 14px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Role</td>
                    <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-transform:capitalize;font-weight:600;color:${assignedRole === 'admin' ? '#c05621' : '#2b6cb0'};">${assignedRole}</td>
                  </tr>
                  ${phone ? `<tr style="background:#f9fafb"><td style="padding:10px 14px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Phone</td><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">${phone}</td></tr>` : ''}
                  <tr style="background:#f0f9ff">
                    <td style="padding:10px 14px;font-weight:600;color:#374151;">Password</td>
                    <td style="padding:10px 14px;font-weight:700;color:#1d4ed8;">${randomPassword}</td>
                  </tr>
                </table>
                <p style="color:#dc2626;font-size:12px;margin-top:16px;">⚠️ Please change your password after your first login.</p>
              </div>
            </div>`,
        });
        res.json({ message: `${assignedRole === 'admin' ? 'Admin' : 'User'} ${username} created and email sent to ${email}` });
      } catch (emailErr) {
        db.query('DELETE FROM users WHERE username = ? AND email = ?', [username, email], () => {});
        return res.status(400).json({
          message: `Could not send email to "${email}". Please check the email address and try again. Account was not created.`,
        });
      }
    }
  );
});

// ── Get all users ─────────────────────────────────────────────────────────────
router.get('/users', (req, res) => {
  db.query(
    'SELECT id, username, first_name, last_name, phone, email, role, created_at, profile_pic FROM users',
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json(results);
    }
  );
});

// ── Delete account — cannot delete yourself ───────────────────────────────────
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  const requestingAdminId = req.query.requestingAdminId;

  db.query('SELECT role, username, id FROM users WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!results.length) return res.status(404).json({ message: 'User not found' });

    const target = results[0];

    if (requestingAdminId && String(target.id) === String(requestingAdminId))
      return res.status(403).json({ message: 'You cannot delete your own account.' });

    db.query('DELETE FROM users WHERE id = ?', [id], (deleteErr) => {
      if (deleteErr) return res.status(500).json({ message: 'Server error' });
      res.json({ message: 'Account deleted successfully' });
    });
  });
});

// ── Get all change requests ───────────────────────────────────────────────────
router.get('/change-requests', (req, res) => {
  db.query(
    `SELECT cr.*, u.email as current_email, u.first_name as current_first_name,
            u.last_name as current_last_name, u.phone as current_phone,
            u.username as current_username, u.profile_pic as user_profile_pic
     FROM change_requests cr
     JOIN users u ON cr.user_id = u.id
     ORDER BY cr.created_at DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json(results);
    }
  );
});

// ── Approve change request ────────────────────────────────────────────────────
router.post('/change-requests/:id/approve', (req, res) => {
  const { id }                  = req.params;
  const { note, fieldsToApply } = req.body;

  db.query(
    `SELECT cr.*, u.email as current_email, u.username as current_username,
            u.first_name as current_first_name, u.last_name as current_last_name,
            u.phone as current_phone
     FROM change_requests cr JOIN users u ON cr.user_id = u.id WHERE cr.id = ?`,
    [id],
    async (err, results) => {
      if (err || !results.length) return res.status(404).json({ message: 'Request not found' });
      const r = results[0];

      // ✅ Already handled — block and inform
      if (r.status !== 'pending') {
        return res.status(409).json({
          alreadyHandled: true,
          status: r.status,
          message: `This request was already ${r.status.toUpperCase()} by another admin before you acted. No changes were made and no email was sent.`,
        });
      }

      const toApply = fieldsToApply || {
        first_name: r.requested_first_name,
        last_name:  r.requested_last_name,
        username:   r.requested_username,
        email:      r.requested_email,
        phone:      r.requested_phone,
      };

      const updates = [], values = [];
      if (toApply.first_name) { updates.push('first_name = ?'); values.push(toApply.first_name); }
      if (toApply.last_name)  { updates.push('last_name = ?');  values.push(toApply.last_name); }
      if (toApply.username)   { updates.push('username = ?');   values.push(toApply.username); }
      if (toApply.email)      { updates.push('email = ?');      values.push(toApply.email); }
      if (toApply.phone)      { updates.push('phone = ?');      values.push(toApply.phone); }

      if (!updates.length) return res.status(400).json({ message: 'Nothing selected to apply' });
      values.push(r.user_id);

      db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values, async (updateErr) => {
        if (updateErr) {
          if (updateErr.code === 'ER_DUP_ENTRY') {
            if (updateErr.message.includes('phone'))
              return res.status(400).json({ message: 'Phone number already in use.' });
            return res.status(400).json({ message: 'Username or email already taken.' });
          }
          return res.status(500).json({ message: 'Server error' });
        }

        db.query(
          "UPDATE change_requests SET status = 'approved', admin_note = ? WHERE id = ?",
          [note || null, id],
          async () => {
            const newFirstName = toApply.first_name || r.current_first_name;
            const newLastName  = toApply.last_name  || r.current_last_name;
            const newUsername  = toApply.username   || r.current_username;
            const newEmail     = toApply.email      || r.current_email;
            const newPhone     = toApply.phone      || r.current_phone;
            const fullName     = [newFirstName, newLastName].filter(Boolean).join(' ') || newUsername;

            const infoRows = [];
            if (r.requested_first_name) infoRows.push(['First Name', newFirstName || '—', !!toApply.first_name]);
            if (r.requested_last_name)  infoRows.push(['Last Name',  newLastName  || '—', !!toApply.last_name]);
            if (r.requested_username)   infoRows.push(['Username',   newUsername,          !!toApply.username]);
            if (r.requested_email)      infoRows.push(['Email',      newEmail,             !!toApply.email]);
            if (r.requested_phone)      infoRows.push(['Phone',      newPhone || '—',      !!toApply.phone]);
            if (!r.requested_first_name) infoRows.unshift(['First Name', r.current_first_name || '—', false]);
            if (!r.requested_last_name)  infoRows.splice(1, 0, ['Last Name', r.current_last_name || '—', false]);
            if (!r.requested_username)   infoRows.push(['Username', r.current_username, false]);
            if (!r.requested_email)      infoRows.push(['Email', r.current_email, false]);
            if (!r.requested_phone)      infoRows.push(['Phone', r.current_phone || '—', false]);

            try {
              await sendUserInfoEmail({
                to: newEmail,
                subject: 'Maklada — Account Update Approved ✓',
                name: fullName, infoRows, note: note || null, approved: true,
              });
            } catch (e) { console.error('Email error:', e.message); }

            res.json({ message: 'Request approved, user updated and email sent' });
          }
        );
      });
    }
  );
});

// ── Reject change request ─────────────────────────────────────────────────────
router.post('/change-requests/:id/reject', (req, res) => {
  const { id }   = req.params;
  const { note } = req.body;

  db.query(
    `SELECT cr.*, u.email as current_email, u.username as current_username,
            u.first_name as current_first_name, u.last_name as current_last_name,
            u.phone as current_phone
     FROM change_requests cr JOIN users u ON cr.user_id = u.id WHERE cr.id = ?`,
    [id],
    async (err, results) => {
      if (err || !results.length) return res.status(404).json({ message: 'Request not found' });
      const r = results[0];

      // ✅ Already handled — block and inform
      if (r.status !== 'pending') {
        return res.status(409).json({
          alreadyHandled: true,
          status: r.status,
          message: `This request was already ${r.status.toUpperCase()} by another admin before you acted. No changes were made and no email was sent.`,
        });
      }

      db.query(
        "UPDATE change_requests SET status = 'rejected', admin_note = ? WHERE id = ?",
        [note || null, id],
        async () => {
          const fullName = [r.current_first_name, r.current_last_name].filter(Boolean).join(' ') || r.current_username;
          const infoRows = [
            ['First Name', r.current_first_name || '—', false],
            ['Last Name',  r.current_last_name  || '—', false],
            ['Username',   r.current_username,          false],
            ['Email',      r.current_email,             false],
            ['Phone',      r.current_phone || '—',      false],
          ];
          try {
            await sendUserInfoEmail({
              to: r.current_email,
              subject: 'Maklada — Account Update Request Rejected',
              name: fullName, infoRows, note: note || null, approved: false,
            });
          } catch (e) { console.error('Email error:', e.message); }
          res.json({ message: 'Request rejected and email sent' });
        }
      );
    }
  );
});

// ── Delete single change request ──────────────────────────────────────────────
router.delete('/change-requests/:id', (req, res) => {
  db.query('DELETE FROM change_requests WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json({ message: 'Request deleted' });
  });
});

// ── Clear resolved change requests ────────────────────────────────────────────
router.delete('/change-requests', (req, res) => {
  db.query("DELETE FROM change_requests WHERE status != 'pending'", (err) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json({ message: 'History cleared' });
  });
});

// ── Get all reports ───────────────────────────────────────────────────────────
router.get('/reports', (req, res) => {
  db.query(
    `SELECT r.id, r.user_id, r.username, r.filters, r.status, r.created_at,
            u.profile_pic as user_profile_pic
     FROM reports_log r
     LEFT JOIN users u ON r.user_id = u.id
     ORDER BY r.created_at DESC LIMIT 100`,
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json(results);
    }
  );
});

// ── Delete single report ──────────────────────────────────────────────────────
router.delete('/reports/:id', (req, res) => {
  db.query('DELETE FROM reports_log WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json({ message: 'Report deleted' });
  });
});

// ── Clear all reports ─────────────────────────────────────────────────────────
router.delete('/reports', (req, res) => {
  db.query('DELETE FROM reports_log', (err) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json({ message: 'All reports cleared' });
  });
});

module.exports = router;