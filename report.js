require('dotenv').config();
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post('/send-report', async (req, res) => {
  const { messages, username, userEmail } = req.body;

  if (!messages || messages.length === 0) {
    return res.status(400).json({ message: 'No messages to export' });
  }

  try {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));

    await new Promise((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);

      const now = new Date();
      const dateStr = now.toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      const timeStr = now.toLocaleTimeString('fr-FR');

      doc.rect(0, 0, doc.page.width, 80).fill('#1a2332');
      doc.fillColor('white')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('MAKLADA ELJEM', 50, 20);
      doc.fontSize(11)
        .font('Helvetica')
        .text('Rapport de conversation — Assistant IA Maintenance', 50, 46);
      doc.fillColor('#e8703a')
        .fontSize(9)
        .text(`Généré le ${dateStr} à ${timeStr}  |  Utilisateur: ${username || 'N/A'}`, 50, 62);

      doc.moveDown(3);

      const userMsgs = messages.filter(m => m.role === 'user').length;
      const aiMsgs = messages.filter(m => m.role !== 'user').length;

      doc.fillColor('#1a2332')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(`RÉSUMÉ:  ${messages.length} messages  |  ${userMsgs} questions  |  ${aiMsgs} réponses IA`, 50, doc.y);

      doc.moveTo(50, doc.y + 8)
        .lineTo(doc.page.width - 50, doc.y + 8)
        .strokeColor('#e8703a')
        .lineWidth(1.5)
        .stroke();

      doc.moveDown(2);

      messages.forEach((msg, index) => {
        if (msg.role === 'ai' && index === 0) return;

        const isUser = msg.role === 'user';
        const label = isUser ? `👤 ${username || 'Utilisateur'}` : '🤖 Assistant IA';
        const bgColor = isUser ? '#e8f4fd' : '#f8f9fa';
        const labelColor = isUser ? '#1a6fa8' : '#e8703a';

        if (doc.y > doc.page.height - 150) {
          doc.addPage();
        }

        const startY = doc.y;
        const textWidth = doc.page.width - 120;

        const textHeight = doc.heightOfString(msg.content || '', {
          width: textWidth,
          fontSize: 10,
        });

        const boxHeight = textHeight + 40;

        doc.rect(50, startY, doc.page.width - 100, boxHeight).fill(bgColor);

        doc.fillColor(labelColor)
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(label, 62, startY + 10);

        if (msg.time) {
          doc.fillColor('#999')
            .fontSize(8)
            .font('Helvetica')
            .text(msg.time, doc.page.width - 110, startY + 10);
        }

        doc.fillColor('#1a2332')
          .fontSize(10)
          .font('Helvetica')
          .text(msg.content || '', 62, startY + 24, {
            width: textWidth,
            lineGap: 2,
          });

        doc.y = startY + boxHeight + 8;
        doc.moveDown(0.3);
      });

      doc.moveDown(2);
      doc.moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .strokeColor('#ddd')
        .lineWidth(0.5)
        .stroke();

      doc.moveDown(0.5);
      doc.fillColor('#999')
        .fontSize(8)
        .font('Helvetica')
        .text(
          'Ce rapport a été généré automatiquement par le système MAKLADA — Assistant IA Maintenance Industrielle',
          50, doc.y,
          { align: 'center', width: doc.page.width - 100 }
        );

      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);

    const now = new Date();
    const filename = `rapport-chat-${now.toISOString().slice(0, 10)}-${username || 'user'}.pdf`;

    await transporter.sendMail({
      from: `"Maklada App" <${process.env.EMAIL_USER}>`,
      to: userEmail || process.env.EMAIL_USER,
      subject: `📊 Rapport IA Maintenance — ${username || 'Utilisateur'} — ${now.toLocaleDateString('fr-FR')}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px;">
          <div style="background: #1a2332; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: white; margin: 0;">MAKLADA ELJEM</h2>
            <p style="color: #e8703a; margin: 4px 0 0;">Rapport de conversation IA</p>
          </div>
          <p style="color: #333;">Un nouveau rapport de conversation a été généré.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #1a2332;">Utilisateur</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${username || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #1a2332;">Date</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${now.toLocaleDateString('fr-FR')}</td>
            </tr>
            <tr style="background: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #1a2332;">Heure</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${now.toLocaleTimeString('fr-FR')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #1a2332;">Messages</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${messages.length} messages</td>
            </tr>
          </table>
          <p style="color: #666; font-size: 13px;">Le rapport complet est joint en PDF à cet email.</p>
        </div>
      `,
      attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }]
    });

    console.log(`📧 Report sent for user: ${username}`);
    res.json({ message: 'Report sent successfully!' });

  } catch (err) {
    console.error('❌ Report error:', err.message);
    res.status(500).json({ message: 'Failed to generate or send report: ' + err.message });
  }
});

module.exports = router;