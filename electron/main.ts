// src/main.ts - Cleaned for Render Deployment

import { app, BrowserWindow } from 'electron'; // 'session' is still useful for general webPreferences, but its specific localtunnel use is removed
//import { autoUpdater } from 'electron-updater'; // Keep commented out for now
import path from 'node:path';
import { fileURLToPath } from 'node:url';
//import fs from 'fs'; // Not needed for this current logic

// electron-vite utilities
import { electronApp, is } from '@electron-toolkit/utils'; // Re-added optimizer

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let mainWindow: BrowserWindow | null;

/**
 * Create the main application window.
 */
const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'), // Ensure this icon path is correct
    width: 1200,
    height: 800,
    show: false, // Prevent flashing on startup
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'), // Ensure this path is correct for your preload script
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !is.dev, // Enable webSecurity in production builds, disable in dev
    },
  });

  mainWindow.maximize();

  // Test active push message to Renderer-process.
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
};

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    mainWindow = null;
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// Run update check only in production (commented out as per your request)
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron'); // From electron-vite utilities

  // Default open or close DevTools in development and ignore for production.
  // optimizer.maximizeAndRestore(); // Removed: This method does not exist on optimizer

  // --- REMOVED LOCAL TUNNEL BYPASS LOGIC ---
  // The session.defaultSession.webRequest.onBeforeSendHeaders logic is removed
  // as it's no longer needed when connecting directly to a public backend.

  createMainWindow();

  if (!VITE_DEV_SERVER_URL) {
    // checkForUpdates(); // Commented out
  }
});
