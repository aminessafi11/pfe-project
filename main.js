const { app, BrowserWindow, ipcMain, shell, Menu, session } = require('electron');
const path = require('path');
const https = require('https');
const { execFile } = require('child_process');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';
let mainWindow;
let backendProcess;

function startBackend() {
  if (isDev) return;

  const serverPath = path.join(process.resourcesPath, 'server', 'index.js');
  const nodeExe = 'C:\\Program Files\\nodejs\\node.exe';
  const logPath = path.join(app.getPath('userData'), 'backend.log');

  fs.writeFileSync(logPath, `Starting backend...\nNode: ${nodeExe}\nServer: ${serverPath}\n`);

  backendProcess = execFile(nodeExe, [serverPath], {
    env: {
      ...process.env,
      PORT: '5000',
      DB_HOST: 'localhost',
      DB_USER: 'root',
      DB_PASSWORD: 'yourpassword',
      DB_NAME: 'your db',
      JWT_SECRET: 'your jwt',
      EMAIL_USER: 'your gmail.com',
      EMAIL_PASS: 'your pass',
    },
    cwd: path.join(process.resourcesPath, 'server'),
  }, (error, stdout, stderr) => {
    if (error) fs.appendFileSync(logPath, `ERROR: ${error.message}\n`);
    if (stdout) fs.appendFileSync(logPath, `OUT: ${stdout}\n`);
    if (stderr) fs.appendFileSync(logPath, `ERR: ${stderr}\n`);
  });
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

function createWindow() {
  // Use persistent session so Microsoft login cookies are saved between app launches
  const ses = session.fromPartition('persist:maklada');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    icon: path.join(__dirname, '../assets/desk.ico'),
    frame: false,
    transparent: false,
    backgroundColor: '#EEF2F7',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: false,
      session: ses,
    },
    show: false,
    center: true,
  });

  // Only apply CSP to our local app pages, NOT to Power BI / Microsoft domains
  ses.webRequest.onHeadersReceived((details, callback) => {
    const url = details.url || '';
    const isPowerBI = url.includes('powerbi.com') || url.includes('microsoft.com') || url.includes('msecnd.net') || url.includes('microsoftonline.com');

    if (isPowerBI) {
      // Don't touch Power BI / Microsoft headers at all
      callback({ responseHeaders: details.responseHeaders });
      return;
    }

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3000 http://localhost:5000",
            "connect-src 'self' http://localhost:3000 http://localhost:5000 https://api.groq.com https://*.powerbi.com https://*.microsoft.com https://*.microsoftonline.com https://fonts.googleapis.com",
            "frame-src 'self' https://app.powerbi.com https://*.powerbi.com https://*.microsoft.com https://*.msecnd.net https://*.microsoftonline.com",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.powerbi.com https://*.microsoft.com https://*.msecnd.net",
            "style-src 'self' 'unsafe-inline' https://*.powerbi.com https://*.microsoft.com https://fonts.googleapis.com",
            "font-src 'self' data: https://fonts.gstatic.com https://*.powerbi.com",
            "img-src 'self' data: blob: https://*.powerbi.com https://*.microsoft.com https://*.msecnd.net",
            "media-src 'self' data: blob:",
          ].join('; ')
        ]
      }
    });
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  setTimeout(() => {
    mainWindow.loadURL(startUrl);
  }, 4000);

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('maximize', () => mainWindow.webContents.send('window-state-change', { maximized: true }));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-state-change', { maximized: false }));
  mainWindow.on('closed', () => { mainWindow = null; });
  Menu.setApplicationMenu(null);
}

ipcMain.handle('groq-call', async (_, { apiKey, messages }) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.05,
      max_tokens: 900,
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(parsed.error.message));
          else resolve(parsed.choices[0].message.content);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
});

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.close());
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false);
ipcMain.on('open-external', (_, url) => shell.openExternal(url));

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});