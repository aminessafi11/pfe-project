const fs = require('fs');

const fix = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/process\.env\.DB_HOST/g, "'localhost'");
  content = content.replace(/process\.env\.DB_USER/g, "'root'");
  content = content.replace(/process\.env\.DB_PASSWORD/g, "'Amin1221essefi@gmail'");
  content = content.replace(/process\.env\.DB_NAME/g, "'maklada_db'");
  content = content.replace(/process\.env\.EMAIL_USER/g, "'maklada.eljem@gmail.com'");
  content = content.replace(/process\.env\.EMAIL_PASS/g, "'jmrqvhiwbvhivziq'");
  content = content.replace(/process\.env\.JWT_SECRET/g, "'maklada_super_secret_key_2025'");
  fs.writeFileSync(file, content);
  console.log('Fixed: ' + file);
};

fix('./server/admin.js');
fix('./server/auth.js');