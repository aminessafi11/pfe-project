require('dotenv').config();
const express = require('express');
const router  = express.Router();
const mysql   = require('mysql2/promise');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const Database = require('better-sqlite3');
const path = require('path');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const DB_CONFIG = {
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const SQLITE_PATH = path.join(__dirname, 'database.db');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function getDb() {
  return new Database(SQLITE_PATH, { readonly: true });
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

const chartW = 495, chartH = 220;
const renderer     = new ChartJSNodeCanvas({ width: chartW, height: chartH, backgroundColour: 'white' });
const rendererWide = new ChartJSNodeCanvas({ width: chartW, height: 200, backgroundColour: 'white' });

function fmtNum(v) {
  if (v == null) return '—';
  const n = Number(v);
  if (isNaN(n)) return '—';
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' DT';
}
function fmt(v) { return v == null ? '—' : String(v); }

async function makeDonut(summary) {
  return renderer.renderToBuffer({
    type: 'doughnut',
    data: {
      labels: ['Correctif', 'Preventif', 'Amelioration'],
      datasets: [{
        data: [summary.correctif || 0, summary.preventif || 0, summary.amelioration || 0],
        backgroundColor: ['#e74c3c', '#3E87C7', '#2ecc71'],
        borderWidth: 2, borderColor: '#fff',
      }],
    },
    options: {
      plugins: {
        title: { display: true, text: 'Repartition par Type de Travail', font: { size: 13, weight: 'bold' }, color: '#1A2F4A' },
        legend: { position: 'bottom', labels: { font: { size: 10 }, padding: 12 } },
      },
      responsive: false, cutout: '55%',
    },
  });
}

async function makeBarMonthly(byMonth) {
  const labels = byMonth.map(r => (r.MOIS_NOM || `M${r.MOIS}`).substring(0, 3));
  return rendererWide.renderToBuffer({
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Depannages',    data: byMonth.map(r => r.dep  || 0), backgroundColor: '#e74c3c', borderRadius: 3 },
        { label: 'Preventifs',    data: byMonth.map(r => r.prev || 0), backgroundColor: '#3E87C7', borderRadius: 3 },
        { label: 'Ameliorations', data: byMonth.map(r => r.amel || 0), backgroundColor: '#2ecc71', borderRadius: 3 },
      ],
    },
    options: {
      plugins: {
        title: { display: true, text: 'BT par Mois', font: { size: 13, weight: 'bold' }, color: '#1A2F4A' },
        legend: { position: 'bottom', labels: { font: { size: 9 }, padding: 8 } },
      },
      scales: {
        x: { ticks: { font: { size: 8 } }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { font: { size: 8 } } },
      },
      responsive: false,
    },
  });
}

async function makeLineYearly(byYear) {
  return rendererWide.renderToBuffer({
    type: 'line',
    data: {
      labels: byYear.map(r => fmt(r.ANNEE)),
      datasets: [
        {
          label: 'Total BT', data: byYear.map(r => r.nb_bts || 0),
          borderColor: '#3E87C7', backgroundColor: 'rgba(62,135,199,0.12)',
          fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: '#3E87C7',
        },
        {
          label: 'Depannages', data: byYear.map(r => r.dep || 0),
          borderColor: '#e74c3c', backgroundColor: 'transparent',
          fill: false, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#e74c3c',
          borderDash: [4, 3],
        },
      ],
    },
    options: {
      plugins: {
        title: { display: true, text: 'Evolution Annuelle des BT', font: { size: 13, weight: 'bold' }, color: '#1A2F4A' },
        legend: { position: 'bottom', labels: { font: { size: 9 }, padding: 8 } },
      },
      scales: {
        x: { ticks: { font: { size: 9 } }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { font: { size: 9 } } },
      },
      responsive: false,
    },
  });
}

async function makeTopParts(topParts) {
  const data = topParts.slice(0, 8);
  return renderer.renderToBuffer({
    type: 'bar',
    data: {
      labels: data.map(r => (r.DESIG_ART || '—').substring(0, 18)),
      datasets: [{
        label: 'Cout (DT)', data: data.map(r => r.cout || 0),
        backgroundColor: '#e67e22', borderRadius: 3,
      }],
    },
    options: {
      indexAxis: 'y',
      plugins: {
        title: { display: true, text: 'Top Pieces par Cout (DT)', font: { size: 13, weight: 'bold' }, color: '#1A2F4A' },
        legend: { display: false },
      },
      scales: {
        x: { beginAtZero: true, ticks: { font: { size: 8 } } },
        y: { ticks: { font: { size: 8 } } },
      },
      responsive: false,
    },
  });
}

function buildWhere(f) {
  const c = [], p = [];
  if (f.machine)      { c.push('b.NU_MACHINE = ?');    p.push(parseInt(f.machine)); }
  if (f.year)         { c.push('b.ANNEE = ?');         p.push(parseInt(f.year)); }
  if (f.month)        { c.push('b.MOIS = ?');          p.push(parseInt(f.month)); }
  if (f.service)      { c.push('b.SERVICE_LABEL = ?'); p.push(f.service); }
  if (f.centreCharge) { c.push('s.CENT_CHARG = ?');    p.push(parseInt(f.centreCharge)); }
  return { where: c.length ? 'WHERE ' + c.join(' AND ') : '', params: p };
}

function buildSimpleWhere(f) {
  const c = [], p = [];
  if (f.machine) { c.push('NU_MACHINE = ?'); p.push(parseInt(f.machine)); }
  if (f.year)    { c.push('ANNEE = ?');      p.push(parseInt(f.year)); }
  if (f.month)   { c.push('MOIS = ?');       p.push(parseInt(f.month)); }
  if (f.service) { c.push('SERVICE_LABEL = ?'); p.push(f.service); }
  return { where: c.length ? 'WHERE ' + c.join(' AND ') : '', params: p };
}

// ── POST /api/profile ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ message: 'Username required' });
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    const [rows] = await conn.execute(
      'SELECT id, username, first_name, last_name, phone, email, role, created_at, profile_pic FROM users WHERE username = ?',
      [username]
    );
    await conn.end();
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST /api/profile/upload-pic ─────────────────────────────────────────────
router.post('/upload-pic', async (req, res) => {
  const { userId, imageData } = req.body;
  if (!userId) return res.status(400).json({ message: 'Missing data' });
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    await conn.execute('UPDATE users SET profile_pic = ? WHERE id = ?', [imageData || null, userId]);
    await conn.end();
    res.json({ message: 'Profile picture saved' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST /api/profile/request-change ─────────────────────────────────────────
router.post('/request-change', async (req, res) => {
  const {
    userId, username,
    requestedUsername, requestedEmail,
    requestedFirstName, requestedLastName, requestedPhone,
  } = req.body;

  if (!userId || !username) return res.status(400).json({ message: 'Missing data' });

  const hasChange = requestedUsername || requestedEmail || requestedFirstName || requestedLastName || requestedPhone;
  if (!hasChange) return res.status(400).json({ message: 'Provide at least one field to change' });

  // Validate email format if provided
  if (requestedEmail) {
    if (!emailRegex.test(requestedEmail))
      return res.status(400).json({ message: 'Please enter a valid email address (e.g. user@company.com)' });
  }

  // Validate username format if provided
  if (requestedUsername) {
    const usernameRegex = /^[a-zA-Z0-9._-]{3,30}$/;
    if (!usernameRegex.test(requestedUsername))
      return res.status(400).json({ message: 'Username must be 3-30 characters: letters, numbers, dots, dashes or underscores only' });
  }

  try {
    const conn = await mysql.createConnection(DB_CONFIG);

    if (requestedUsername) {
      const [taken] = await conn.execute('SELECT id FROM users WHERE username = ? AND id != ?', [requestedUsername, userId]);
      if (taken.length > 0) { await conn.end(); return res.status(400).json({ message: 'This username is already taken.' }); }
    }
    if (requestedEmail) {
      const [taken] = await conn.execute('SELECT id FROM users WHERE email = ? AND id != ?', [requestedEmail, userId]);
      if (taken.length > 0) { await conn.end(); return res.status(400).json({ message: 'This email is already in use.' }); }
    }
    if (requestedPhone) {
      const [taken] = await conn.execute('SELECT id FROM users WHERE phone = ? AND id != ?', [requestedPhone, userId]);
      if (taken.length > 0) { await conn.end(); return res.status(400).json({ message: 'This phone number is already used by another account.' }); }
    }

    // Replace any existing pending request
    await conn.execute("DELETE FROM change_requests WHERE user_id = ? AND status = 'pending'", [userId]);

    await conn.execute(
      `INSERT INTO change_requests
        (user_id, username, requested_username, requested_email, requested_first_name, requested_last_name, requested_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, username,
        requestedUsername  || null,
        requestedEmail     || null,
        requestedFirstName || null,
        requestedLastName  || null,
        requestedPhone     || null,
      ]
    );
    await conn.end();
    res.json({ message: 'Request submitted successfully. Waiting for admin approval.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET /api/profile/my-request/:userId ──────────────────────────────────────
router.get('/my-request/:userId', async (req, res) => {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    const [rows] = await conn.execute(
      'SELECT * FROM change_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.params.userId]
    );
    await conn.end();
    res.json(rows[0] || null);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET /api/profile/my-reports/:userId ──────────────────────────────────────
router.get('/my-reports/:userId', async (req, res) => {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    const [rows] = await conn.execute(
      `SELECT id, filters, observations, status, error_message, created_at
       FROM reports_log WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 10`,
      [req.params.userId]
    );
    await conn.end();
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── DELETE /api/profile/my-reports/:reportId ─────────────────────────────────
router.delete('/my-reports/:reportId', async (req, res) => {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    await conn.execute('DELETE FROM reports_log WHERE id = ?', [req.params.reportId]);
    await conn.end();
    res.json({ message: 'Report deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── DELETE /api/profile/my-reports/clear/:userId ─────────────────────────────
router.delete('/my-reports/clear/:userId', async (req, res) => {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    await conn.execute('DELETE FROM reports_log WHERE user_id = ?', [req.params.userId]);
    await conn.end();
    res.json({ message: 'History cleared' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET filter routes ─────────────────────────────────────────────────────────
router.get('/machines', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`SELECT DISTINCT NU_MACHINE FROM bons_de_travail WHERE NU_MACHINE IS NOT NULL ORDER BY NU_MACHINE ASC LIMIT 200`).all();
    db.close();
    res.json({ machines: rows.map(r => r.NU_MACHINE) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/years', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`SELECT DISTINCT ANNEE FROM bons_de_travail WHERE ANNEE IS NOT NULL ORDER BY ANNEE DESC`).all();
    db.close();
    res.json({ years: rows.map(r => r.ANNEE).filter(Boolean) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/months', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`SELECT DISTINCT MOIS, MOIS_NOM FROM bons_de_travail WHERE MOIS IS NOT NULL ORDER BY MOIS ASC`).all();
    db.close();
    res.json({ months: rows });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/services', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`SELECT DISTINCT SERVICE_LABEL FROM bons_de_travail WHERE SERVICE_LABEL IS NOT NULL AND SERVICE_LABEL != '' ORDER BY SERVICE_LABEL ASC`).all();
    db.close();
    res.json({ services: rows.map(r => r.SERVICE_LABEL) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/centres', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`SELECT DISTINCT CENT_CHARG FROM sorties_pieces WHERE CENT_CHARG IS NOT NULL ORDER BY CENT_CHARG ASC`).all();
    db.close();
    res.json({ centres: rows.map(r => r.CENT_CHARG).filter(v => v !== null && v !== '') });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST /api/profile/report ──────────────────────────────────────────────────
router.post('/report', async (req, res) => {
  const { username, userEmail, filters, observations, userId } = req.body;
  if (!username || !userEmail) return res.status(400).json({ message: 'Missing required fields' });

  const f = filters || {};
  const needsJoin = !!f.centreCharge;

  try {
    const db = getDb();
    const { where: wj, params: pj } = buildWhere(f);
    const { where: ws, params: ps } = buildSimpleWhere(f);

    const summary = db.prepare(`
      SELECT COUNT(*) AS total_bts,
        SUM(CASE WHEN TYPE_TRAVAIL='Dépannage'    THEN 1 ELSE 0 END) AS correctif,
        SUM(CASE WHEN TYPE_TRAVAIL='Préventif'    THEN 1 ELSE 0 END) AS preventif,
        SUM(CASE WHEN TYPE_TRAVAIL='Amélioration' THEN 1 ELSE 0 END) AS amelioration,
        COUNT(DISTINCT NU_MACHINE) AS machines_count,
        MIN(DATE_DEM) AS premiere_intervention,
        MAX(DATE_DEM) AS derniere_intervention
      FROM bons_de_travail ${ws}
    `).get(...ps);

    const totalCost = db.prepare(`
      SELECT ROUND(SUM(s.COUT_TOTAL), 2) AS cout_total
      FROM sorties_pieces s INNER JOIN bons_de_travail b ON s.NU__BT = b.NU__BT ${wj}
    `).get(...pj);

    const byMonth = db.prepare(`
      SELECT b.MOIS, b.MOIS_NOM, COUNT(DISTINCT b.NU__BT) AS nb_bts,
        SUM(CASE WHEN b.TYPE_TRAVAIL='Dépannage'    THEN 1 ELSE 0 END) AS dep,
        SUM(CASE WHEN b.TYPE_TRAVAIL='Préventif'    THEN 1 ELSE 0 END) AS prev,
        SUM(CASE WHEN b.TYPE_TRAVAIL='Amélioration' THEN 1 ELSE 0 END) AS amel
      FROM bons_de_travail b
      ${needsJoin ? 'INNER JOIN sorties_pieces s ON b.NU__BT = s.NU__BT ' + wj : ws}
      GROUP BY b.MOIS, b.MOIS_NOM ORDER BY b.MOIS
    `).all(...(needsJoin ? pj : ps));

    const byYear = db.prepare(`
      SELECT b.ANNEE, COUNT(DISTINCT b.NU__BT) AS nb_bts,
        SUM(CASE WHEN b.TYPE_TRAVAIL='Dépannage' THEN 1 ELSE 0 END) AS dep,
        SUM(CASE WHEN b.TYPE_TRAVAIL='Préventif'  THEN 1 ELSE 0 END) AS prev
      FROM bons_de_travail b
      ${needsJoin ? 'INNER JOIN sorties_pieces s ON b.NU__BT = s.NU__BT ' + wj : ws}
      GROUP BY b.ANNEE ORDER BY b.ANNEE
    `).all(...(needsJoin ? pj : ps));

    const byMachine = db.prepare(`
      SELECT b.NU_MACHINE, COUNT(DISTINCT b.NU__BT) AS nb_bts,
             ROUND(SUM(s.COUT_TOTAL), 2) AS cout
      FROM bons_de_travail b
      LEFT JOIN sorties_pieces s ON b.NU__BT = s.NU__BT ${wj}
      GROUP BY b.NU_MACHINE ORDER BY cout DESC LIMIT 10
    `).all(...pj);

    const topParts = db.prepare(`
      SELECT s.DESIG_ART, COUNT(*) AS nb, ROUND(SUM(s.COUT_TOTAL), 2) AS cout
      FROM sorties_pieces s INNER JOIN bons_de_travail b ON s.NU__BT = b.NU__BT ${wj}
      GROUP BY s.DESIG_ART ORDER BY cout DESC LIMIT 10
    `).all(...pj);

    const byService = db.prepare(`
      SELECT b.SERVICE_LABEL, COUNT(DISTINCT b.NU__BT) AS nb_bts
      FROM bons_de_travail b
      ${needsJoin ? 'INNER JOIN sorties_pieces s ON b.NU__BT = s.NU__BT ' + wj : ws}
      GROUP BY b.SERVICE_LABEL ORDER BY nb_bts DESC LIMIT 10
    `).all(...(needsJoin ? pj : ps));

    db.close();

    const stats = {
      summary: { ...summary, cout_total: totalCost?.cout_total },
      byMonth, byYear, byMachine, topParts, byService,
    };

    const charts = {};
    charts.donut = await makeDonut(stats.summary);
    if (byMonth.length > 0)  charts.barMonthly = await makeBarMonthly(byMonth);
    if (byYear.length > 1)   charts.lineYearly = await makeLineYearly(byYear);
    if (topParts.length > 1) charts.topParts   = await makeTopParts(topParts);

    const pdfBuffer = await buildPDF({ filters: f, stats, charts, observations, username });

    const parts = [];
    if (f.machine)      parts.push(`Machine ${f.machine}`);
    if (f.year)         parts.push(`Annee ${f.year}`);
    if (f.month)        parts.push(`Mois ${f.month}`);
    if (f.service)      parts.push(f.service);
    if (f.centreCharge) parts.push(`Centre ${f.centreCharge}`);
    const reportTitle = parts.length ? parts.join(' · ') : 'Rapport Global';

    await transporter.sendMail({
      from: `"MAKLADA BI Portal" <${EMAIL_USER}>`,
      to: userEmail,
      subject: `Rapport Maintenance - ${reportTitle}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
        <div style="background:#1A2F4A;padding:24px;border-radius:12px;text-align:center">
          <h2 style="color:#5BAEE0;margin:0 0 8px">Rapport de Maintenance</h2>
          <p style="color:#a0c4dc;margin:0;font-size:14px">${reportTitle}</p>
        </div>
        <div style="padding:20px;background:#f5f8fc;border-radius:0 0 12px 12px">
          <p style="color:#333;">Bonjour <strong>${username}</strong>,</p>
          <p style="color:#555;font-size:13px">Rapport <strong>${reportTitle}</strong> en piece jointe.</p>
          <hr style="border:none;border-top:1px solid #dce4ed;margin:16px 0"/>
          <p style="color:#888;font-size:11px;text-align:center">MAKLADA PFE PROJECT</p>
        </div>
      </div>`,
      attachments: [{
        filename: `Rapport_${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    });

    try {
      const logConn = await mysql.createConnection(DB_CONFIG);
      await logConn.execute(
        `INSERT INTO reports_log (user_id, username, filters, observations, status) VALUES (?, ?, ?, ?, 'success')`,
        [userId || 0, username, JSON.stringify(f), observations ? observations.substring(0, 200) : null]
      );
      await logConn.end();
    } catch (logErr) { console.error('Log error:', logErr.message); }

    res.json({ message: `Rapport envoye a ${userEmail}` });

  } catch (err) {
    console.error('[profile/report]', err.message);
    try {
      const logConn = await mysql.createConnection(DB_CONFIG);
      await logConn.execute(
        `INSERT INTO reports_log (user_id, username, filters, status, error_message) VALUES (?, ?, ?, 'failed', ?)`,
        [userId || 0, username || 'unknown', JSON.stringify(f || {}), err.message.substring(0, 200)]
      );
      await logConn.end();
    } catch {}
    res.status(500).json({ message: err.message });
  }
});

// ── PDF Builder ───────────────────────────────────────────────────────────────
function buildPDF({ filters, stats, charts, observations, username }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, autoFirstPage: true });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const BLUE   = '#2c6fa6';
    const DKBLUE = '#1A2F4A';
    const ACCENT = '#3E87C7';
    const GREY   = '#6b7c93';
    const LIGHT  = '#f0f5fa';
    const L = 50, W = 495, PAGE_W = 595, PAGE_H = 841;
    const FOOTER_H = 36;
    const SAFE_BOTTOM = PAGE_H - FOOTER_H - 10;

    const f = filters;
    const { summary, byMonth, byYear, byMachine, topParts, byService } = stats;

    const parts = [];
    if (f.machine)      parts.push(`Machine ${f.machine}`);
    if (f.year)         parts.push(`Annee ${f.year}`);
    if (f.month)        parts.push(`Mois ${f.month}`);
    if (f.service)      parts.push(f.service);
    if (f.centreCharge) parts.push(`Centre ${f.centreCharge}`);
    const reportTitle = parts.length ? parts.join(' · ') : 'Rapport Global';

    let pageNum = 1;

    function drawFooter() {
      doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H).fill(DKBLUE);
      doc.fontSize(8).fillColor('#7aaccc').font('Helvetica')
         .text(`MAKLADA PFE PROJECT · Mohamed Amin Essefi & Tark Souki · Page ${pageNum}`,
           L, PAGE_H - FOOTER_H + 13, { align: 'center', width: W });
    }

    function newPage() { drawFooter(); doc.addPage(); pageNum++; doc.y = 50; }
    function spaceLeft() { return SAFE_BOTTOM - doc.y; }
    function needSpace(h) { if (spaceLeft() < h) newPage(); }

    function sectionTitle(label) {
      needSpace(40);
      doc.moveDown(0.25);
      doc.rect(L, doc.y, W, 1).fill(ACCENT);
      doc.y += 4;
      doc.fontSize(11).fillColor(DKBLUE).font('Helvetica-Bold').text(label, L);
      doc.moveDown(0.25);
    }

    function tHeader(cols) {
      needSpace(22);
      const y0 = doc.y;
      doc.rect(L, y0, W, 20).fill(BLUE);
      cols.forEach(c => {
        doc.fillColor('#fff').fontSize(8.5).font('Helvetica-Bold')
           .text(c.label, c.x, y0 + 6, { width: c.w, align: c.align || 'left' });
      });
      doc.y = y0 + 20;
    }

    function tRow(cols, values, i) {
      needSpace(19);
      const y0 = doc.y;
      if (i % 2 === 0) doc.rect(L, y0, W, 18).fill('#eaf1f8');
      cols.forEach((c, ci) => {
        doc.fillColor('#1a2e45').fontSize(8.5).font('Helvetica')
           .text(values[ci] || '—', c.x, y0 + 4, { width: c.w, align: c.align || 'left' });
      });
      doc.y = y0 + 18;
    }

    function embedChart(buf, imgH) {
      needSpace(imgH + 16);
      doc.image(buf, L, doc.y, { width: W, height: imgH });
      doc.y += imgH + 10;
    }

    doc.rect(0, 0, PAGE_W, 95).fill(DKBLUE);
    doc.rect(0, 95, PAGE_W, 4).fill(ACCENT);
    doc.fontSize(21).fillColor('#fff').font('Helvetica-Bold').text('MAKLADA PFE PROJECT', L, 16);
    doc.fontSize(11).fillColor('#a8cce0').font('Helvetica')
       .text('Portail BI · Maintenance Industrielle · Maklada Eljem', L, 46);
    doc.fontSize(9).fillColor('#6ba0c0')
       .text(`Genere le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} · Utilisateur : ${username}`, L, 64);
    doc.fontSize(9).fillColor('#5BAEE0').text(`Filtres : ${reportTitle}`, L, 80);
    doc.y = 110;

    if (observations && observations.trim()) {
      sectionTitle('Observations / Rapport Redige');
      const obsText = observations.trim();
      const obsH = Math.min(doc.heightOfString(obsText, { width: W - 20, fontSize: 10 }) + 24, 160);
      needSpace(obsH + 10);
      const obsY = doc.y;
      doc.rect(L, obsY, W, obsH).fill('#fffef5').stroke('#f0c040');
      doc.fillColor('#333').fontSize(10).font('Helvetica')
         .text(obsText, L + 10, obsY + 10, { width: W - 20, lineGap: 3, height: obsH - 15 });
      doc.y = obsY + obsH + 8;
    }

    sectionTitle('Resume Global');
    const summaryRows = [
      ['Total BT',              fmt(summary?.total_bts)],
      ['BT Correctifs',         fmt(summary?.correctif)],
      ['BT Preventifs',         fmt(summary?.preventif)],
      ['BT Ameliorations',      fmt(summary?.amelioration)],
      ['Cout Total Pieces',     fmtNum(summary?.cout_total)],
      ['Machines concernees',   fmt(summary?.machines_count)],
      ['Premiere Intervention', fmt(summary?.premiere_intervention)],
      ['Derniere Intervention', fmt(summary?.derniere_intervention)],
    ];

    const ROW_H = 20;
    const totalSummaryH = summaryRows.length * ROW_H;
    needSpace(totalSummaryH + 10);
    const startY = doc.y;
    const leftW  = 240;
    const rightX = L + leftW + 14;
    const rightW = W - leftW - 14;

    summaryRows.forEach(([label, value], i) => {
      const y0 = startY + i * ROW_H;
      if (i % 2 === 0) doc.rect(L, y0, leftW, ROW_H).fill(LIGHT);
      doc.fillColor(GREY).fontSize(8.5).font('Helvetica').text(label, L + 6, y0 + 5, { width: 118 });
      doc.fillColor(DKBLUE).fontSize(8.5).font('Helvetica-Bold').text(value, L + 126, y0 + 5, { width: leftW - 132, align: 'right' });
    });
    if (charts.donut) doc.image(charts.donut, rightX, startY, { width: rightW, height: totalSummaryH });
    doc.y = startY + totalSummaryH + 12;

    if (byMonth.length) {
      sectionTitle('Detail Mensuel');
      const cols = [
        { label: 'Mois',       x: 55,  w: 100, align: 'left'   },
        { label: 'Total BT',   x: 160, w: 80,  align: 'center' },
        { label: 'Depannages', x: 245, w: 80,  align: 'center' },
        { label: 'Preventifs', x: 330, w: 80,  align: 'center' },
        { label: 'Amelior.',   x: 415, w: 75,  align: 'center' },
      ];
      tHeader(cols);
      byMonth.forEach((row, i) => tRow(cols, [
        row.MOIS_NOM || `M${row.MOIS}`, fmt(row.nb_bts), fmt(row.dep), fmt(row.prev), fmt(row.amel),
      ], i));
      if (charts.barMonthly) { doc.moveDown(0.3); embedChart(charts.barMonthly, 190); }
    }

    if (byYear.length) {
      sectionTitle('Evolution par Annee');
      const cols = [
        { label: 'Annee',      x: 55,  w: 120, align: 'left'   },
        { label: 'Total BT',   x: 185, w: 100, align: 'center' },
        { label: 'Depannages', x: 295, w: 100, align: 'center' },
        { label: 'Preventifs', x: 405, w: 85,  align: 'center' },
      ];
      tHeader(cols);
      byYear.forEach((row, i) => tRow(cols, [
        fmt(row.ANNEE), fmt(row.nb_bts), fmt(row.dep), fmt(row.prev),
      ], i));
      if (charts.lineYearly) { doc.moveDown(0.3); embedChart(charts.lineYearly, 185); }
    }

    if (byMachine.length) {
      sectionTitle('Top 10 Machines par Cout');
      const cols = [
        { label: 'Machine',   x: 55,  w: 160, align: 'left'   },
        { label: 'Nb BT',     x: 225, w: 100, align: 'center' },
        { label: 'Cout (DT)', x: 335, w: 205, align: 'right'  },
      ];
      tHeader(cols);
      byMachine.forEach((row, i) => tRow(cols, [
        fmt(row.NU_MACHINE), fmt(row.nb_bts), fmtNum(row.cout),
      ], i));
    }

    if (topParts.length) {
      sectionTitle('Top 10 Pieces de Rechange');
      const cols = [
        { label: 'Designation', x: 55,  w: 240, align: 'left'   },
        { label: 'Nb',          x: 300, w: 70,  align: 'center' },
        { label: 'Cout (DT)',   x: 375, w: 165, align: 'right'  },
      ];
      tHeader(cols);
      topParts.forEach((row, i) => tRow(cols, [
        (row.DESIG_ART || '—').substring(0, 34), fmt(row.nb), fmtNum(row.cout),
      ], i));
      if (charts.topParts) { doc.moveDown(0.3); embedChart(charts.topParts, 200); }
    }

    if (byService.length) {
      sectionTitle('BT par Service');
      const cols = [
        { label: 'Service',  x: 55,  w: 340, align: 'left'   },
        { label: 'Total BT', x: 400, w: 140, align: 'center' },
      ];
      tHeader(cols);
      byService.forEach((row, i) => tRow(cols, [
        row.SERVICE_LABEL || '—', fmt(row.nb_bts),
      ], i));
    }

    drawFooter();
    doc.end();
  });
}

module.exports = router;