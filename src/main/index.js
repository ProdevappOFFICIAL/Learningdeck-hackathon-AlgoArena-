import { app, shell, BrowserWindow, ipcMain, protocol } from 'electron'

import { dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import express from 'express'
import fs from 'fs-extra'
import path from 'path'
import chokidar from 'chokidar'
import cors from 'cors'
import os from 'os'
import _ from 'lodash'
import axios from 'axios'
import AdmZip from 'adm-zip'
import { fileURLToPath } from 'url'
import { networkInterfaces } from 'os'
import wifi from 'node-wifi';

// Initialize wifi module
wifi.init({
  iface: null // Uses the first available wifi interface
});

// WiFi network scanning
ipcMain.handle('scan-wifi-networks', async () => {
  try {
    const networks = await wifi.scan();
    
    // Process and format networks for display
    return networks.map(network => ({
      ssid: network.ssid,
      bssid: network.bssid,
      signalStrength: Math.min(Math.max(2 * (network.signal_level + 100), 0), 100), // Convert dBm to percentage (approximate)
      secured: network.security !== '' && network.security !== 'none',
      security: network.security,
      frequency: network.frequency
    }))
    .filter(network => network.ssid) // Filter out networks with empty SSIDs
    .sort((a, b) => b.signalStrength - a.signalStrength); // Sort by signal strength
  } catch (error) {
    console.error('Error scanning WiFi networks:', error);
    throw error;
  }
});

// Get current connection information
ipcMain.handle('get-current-wifi-connection', async () => {
  try {
    const currentConnections = await wifi.getCurrentConnections();
    if (currentConnections.length > 0) {
      const current = currentConnections[0];
      return {
        ssid: current.ssid,
        bssid: current.bssid,
        signalStrength: Math.min(Math.max(2 * (current.signal_level + 100), 0), 100),
        frequency: current.frequency
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting current WiFi connection:', error);
    throw error;
  }
});

// Connect to WiFi network
ipcMain.handle('connect-to-wifi', async (event, ssid, password) => {
  try {
    await wifi.connect({ ssid, password });
    return { success: true, message: `Connected to ${ssid}` };
  } catch (error) {
    console.error(`Error connecting to WiFi network ${ssid}:`, error);
    throw new Error(`Failed to connect to ${ssid}: ${error.message}`);
  }
});

// Disconnect from current WiFi network
ipcMain.handle('disconnect-from-wifi', async () => {
  try {
    await wifi.disconnect();
    return { success: true, message: 'Disconnected from WiFi' };
  } catch (error) {
    console.error('Error disconnecting from WiFi:', error);
    throw error;
  }
});

// Add these collections to store device information
const connectedDevices = new Map() // Map to store device information
const blockedDevices = new Set() // S

let securityEnabled = true
const SECRET_KEY = '3000' // 🔒 Set your API key here
const DB_PATH = path.join(app.getPath('userData'), 'db.json')
const APP = path.join(app.getPath('userData'), 'auth_0x.json')
const __dirname = fileURLToPath(new URL('.', import.meta.url))
// Default content for db.json
const DEFAULT_DB_CONTENT = {
  Batch: [
    {
      batch_no: '1',
      id: '1'
    }
  ],
  Information: [],
  ExamCombination: [],
  Subject: [],
  Classes: [],
  Security: [],
  Question: [],
  Result: [],
  User: []
}

// ✅ **Ensure db.json is properly initialized**
function initializeDatabase() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeJSONSync(DB_PATH, DEFAULT_DB_CONTENT, { spaces: 2 })
      console.log('🆕 Created db.json with default content.')
    } else {
      const existingData = fs.readJSONSync(DB_PATH)
      if (!existingData || Object.keys(existingData).length === 0) {
        fs.writeJSONSync(DB_PATH, DEFAULT_DB_CONTENT, { spaces: 2 })
        console.log('⚠️ db.json was empty. Resetting to default content.')
      }
      if (existingData) {
        fs.readJSONSync(DB_PATH, DEFAULT_DB_CONTENT, { spaces: 2 })
      }
    }
  } catch (error) {
    console.error('❌ Error initializing db.json:', error)
    fs.writeJSONSync(DB_PATH, DEFAULT_DB_CONTENT, { spaces: 2 })
  }
}

// Call initialization
initializeDatabase()

// Load the database content into memory
let db = fs.readJSONSync(DB_PATH)

ipcMain.handle('import-db', async (event) => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Import Database',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile']
  })

  if (filePaths.length === 0) return { success: false, message: 'No file selected' }

  try {
    const newDb = fs.readJSONSync(filePaths[0])
    fs.writeJSONSync(DB_PATH, newDb, { spaces: 2 })
    db = newDb // Update in-memory database
    return { success: true, message: 'Database imported successfully' }
  } catch (error) {
    console.error('❌ Error importing database:', error)
    return { success: false, message: 'Failed to import database' }
  }
})

// ✅ **Save database to file to ensure persistence**
const saveDatabase = () => {
  try {
    fs.writeJSONSync(DB_PATH, db, { spaces: 2 })
    console.log('✅ Database successfully saved.')
  } catch (error) {
    console.error('❌ Error saving database:', error)
  }
}

// 🌍 **Express API Server**
const server = express()
server.use(express.json({ limit: '10000mb', strict: false })) // Increase JSON limit and use non-strict mode
server.use(cors())

// Add request logging middleware
server.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`)
  console.log(`Path: ${req.path}, Query:`, req.query)
  next()
})

// 🔐 **Middleware to Protect Routes**
server.use('/api', (req, res, next) => {
  // const apiKey = req.headers["x-api-key"];
  // if (securityEnabled && apiKey !== SECRET_KEY) {
  //return res.status(403).json({ error: "Forbidden" });
  // }
  next()
})

// 🔄 **Auto-Generated API Routes**
const generateEndpoints = () => {
  Object.keys(db).forEach((resource) => {
    const resourcePath = `/api/${resource}`

    server.get(resourcePath, (req, res) => {
      let data = db[resource]

      const query = req.query
      Object.keys(query).forEach((key) => {
        if (!key.startsWith('_')) {
          data = data.filter((item) => String(item[key]) === String(query[key]))
        }
      })

      if (query._sort) {
        data = _.orderBy(data, query._sort, query._order || 'asc')
      }
      if (query._limit) {
        data = data.slice(0, Number(query._limit))
      }

      res.json(data)
    })

    server.get(`${resourcePath}/:id`, (req, res) => {
      const item = db[resource].find((item) => item.id == req.params.id)
      item ? res.json(item) : res.status(404).json({ error: 'Not found' })
    })

    server.post(resourcePath, (req, res) => {
      const resourceData = db[resource]
      const newId =
        resourceData.length > 0 ? Math.max(...resourceData.map((item) => item.id)) + 1 : 1

      const newItem = { id: newId, ...req.body }
      resourceData.push(newItem)
      saveDatabase() // Persist changes
      res.status(201).json(newItem)
    })

    server.put(`${resourcePath}/:id`, (req, res) => {
      const index = db[resource].findIndex((item) => item.id == req.params.id)
      if (index === -1) return res.status(404).json({ error: 'Not found' })

      db[resource][index] = { ...db[resource][index], ...req.body }
      saveDatabase() // Persist changes
      res.json(db[resource][index])
    })

    server.delete(`${resourcePath}/:id`, (req, res) => {
      db[resource] = db[resource].filter((item) => item.id != req.params.id)
      saveDatabase() // Persist changes
      res.status(204).send()
    })
  })
}

// ✅ **Prevent Chokidar From Resetting In-Memory Changes**
chokidar.watch(DB_PATH, { ignoreInitial: true }).on('change', () => {
  try {
    console.log('🔄 External change detected. Reloading db.json...')
    db = fs.readJSONSync(DB_PATH)
  } catch (error) {
    console.error('❌ Error reloading database:', error)
  }
})
// Add this near the top of the file

const templatesDir = path.join(app.getPath('userData'), 'Templates')

// Ensure templates directory exists
fs.ensureDirSync(templatesDir)

// Track currently active template
let activeTemplatePath = null

// Handler for fetching templates from GitHub
ipcMain.handle('fetch-templates', async () => {
  try {
    const response = await fetch('https://raw.githubusercontent.com/ProdevappOFFICIAL/static-db/refs/heads/main/templates.json')
    
    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`)
    }
    
    const templates = await response.json()
    console.log('Fetched templates:', templates.length)
    return templates
  } catch (error) {
    console.error('Error fetching templates:', error)
    throw new Error(`Failed to fetch templates: ${error.message}`)
  }
})

// Handler for downloading and extracting templates
// Handler for downloading and extracting templates
ipcMain.handle('download-template', async (event, template) => {
  try {
    const { id, name, downloadLink } = template
    console.log(`Downloading template: ${name} from ${downloadLink}`)
    
    // Create template directory if it doesn't exist
    const templateDir = path.join(templatesDir, name)
    fs.ensureDirSync(templateDir)
    
    // Download the template .zip file
    const zipFilePath = path.join(templatesDir, `${name}.zip`)
    
    // Using axios instead of fetch for better stream handling
    const response = await axios({
      method: 'get',
      url: downloadLink,
      responseType: 'stream',
      onDownloadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100)
        
        // Send progress update to renderer
        event.sender.send('download-progress', {
          templateId: id,
          percent,
          downloaded: progressEvent.loaded,
          total: progressEvent.total
        })
      }
    })
    
    // Create file write stream
    const fileStream = fs.createWriteStream(zipFilePath)
    
    // Pipe response to file
    await new Promise((resolve, reject) => {
      response.data.pipe(fileStream)
      
      fileStream.on('finish', () => {
        fileStream.close()
        resolve()
      })
      
      fileStream.on('error', (err) => {
        fs.unlinkSync(zipFilePath)
        reject(err)
      })
    })
    
    console.log(`Download complete: ${name}`)
    
    // Extract the zip file
    console.log(`Extracting template to: ${templateDir}`)
    const zip = new AdmZip(zipFilePath)
    
    // Clean the directory before extracting
    fs.emptyDirSync(templateDir)
    
    // Extract all files
    zip.extractAllTo(templateDir, true)
    
    // Delete the zip file after extraction
    fs.unlinkSync(zipFilePath)
    
    // Set as active template
    activeTemplatePath = templateDir
    
    // Notify renderer about download completion
    event.sender.send('download-complete', {
      id,
      name,
      path: templateDir
    })
    
    return { success: true, name, path: templateDir }
  } catch (error) {
    console.error('Error downloading template:', error)
    throw new Error(`Failed to download template: ${error.message}`)
  }
})

// Handler for getting already downloaded templates
ipcMain.handle('get-downloaded-templates', async () => {
  try {
    if (!fs.existsSync(templatesDir)) {
      return []
    }
    
    const templateFolders = fs.readdirSync(templatesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
    
    return templateFolders
  } catch (error) {
    console.error('Error getting downloaded templates:', error)
    return []
  }
})

// Handler for serving a specific template
ipcMain.handle('serve-template', async (event, templateName) => {
  try {
    const templateDir = path.join(templatesDir, templateName)
    
    if (!fs.existsSync(templateDir)) {
      throw new Error(`Template folder not found: ${templateName}`)
    }
    
    // Set the active template path for the Express server
    activeTemplatePath = templateDir
    console.log(`Now serving template from: ${activeTemplatePath}`)
    
    // Let the Express server know to start using this path
    // No need to restart Express as we'll modify the static folder reference
    
    return { success: true, path: templateDir }
  } catch (error) {
    console.error('Error serving template:', error)
    throw new Error(`Failed to serve template: ${error.message}`)
  }
})

// Handler for opening the template in browser


// 🌐 **Start Combined API & Web Server**
const PORT = 80 // Single port for both services

let buildPath = null

// Helper function to set content type
function setContentType(filepath, res) {
  const ext = path.extname(filepath).toLowerCase()
  if (ext === '.png') {
    res.setHeader('Content-Type', 'image/png')
  } else if (ext === '.jpg' || ext === '.jpeg') {
    res.setHeader('Content-Type', 'image/jpeg')
  } else if (ext === '.svg') {
    res.setHeader('Content-Type', 'image/svg+xml')
  } else if (ext === '.gif') {
    res.setHeader('Content-Type', 'image/gif')
  } else if (ext === '.css') {
    res.setHeader('Content-Type', 'text/css')
  } else if (ext === '.js') {
    res.setHeader('Content-Type', 'application/javascript')
  } else if (ext === '.json') {
    res.setHeader('Content-Type', 'application/json')
  } else if (ext === '.html') {
    res.setHeader('Content-Type', 'text/html')
  }
}


  // Handle template selection from renderer
  ipcMain.on('template-selected', (event, template) => {
    try {
      if (!template) {
        throw new Error('No template received');
      }

      console.log('Template selected in main process:', template);
      
      // You can add your backend logic here
      // For example, process the template, save to file, etc.
      
      // Send a response back to renderer
      event.sender.send('template-response', {
        success: true,
        message: `Template "${template}" received successfully`,
        data: template
      });
    } catch (error) {
      console.error('Error handling template:', error);
      event.sender.send('template-response', {
        success: false,
        message: error.message
      });
    }
  });



const tempDirr = path.join(app.getPath('temp'), 'template-marketplace');
const lds001Dir = path.join(tempDirr, 'Mordern Exam Template','lds-0001' );
const lds002Dir = path.join(tempDirr, 'UTSC Exam Template','out' );

server.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress
  const userAgent = req.headers['user-agent'] || 'Unknown'
  
  // Skip tracking for favicon and static assets
  if (req.path.includes('favicon') || req.path.includes('.')) {
    return next()
  }

  // Generate a unique device ID
  const deviceId = `${ip}-${userAgent.substring(0, 20)}`
  
  // Check if device is blocked
  if (blockedDevices.has(ip)) {
    console.log(`Blocked request from: ${ip}`)
    return res.status(403).json('Access denied, Your device has been blocked.');
  }

  // Create or update device information
  if (!connectedDevices.has(deviceId)) {
    const deviceName = `Device-${connectedDevices.size + 1}`
    const deviceType = detectDeviceType(userAgent)
    
    connectedDevices.set(deviceId, {
      id: deviceId,
      name: deviceName,
      ip: ip,
      type: deviceType,
      userAgent: userAgent,
      status: 'active',
      firstSeen: new Date().toISOString(),
      lastRequest: new Date().toISOString(),
      requestCount: 1,
      recentRequests: [{
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      }]
    })
  } else {
    const device = connectedDevices.get(deviceId)
    device.lastRequest = new Date().toISOString()
    device.requestCount = (device.requestCount || 0) + 1
    
    // Keep only the 10 most recent requests
    const recentRequests = device.recentRequests || []
    recentRequests.unshift({
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    })
    
    device.recentRequests = recentRequests.slice(0, 10)
    connectedDevices.set(deviceId, device)
  }

  console.log(`Request from ${ip} for ${req.path}`)
  next()
})

function detectDeviceType(userAgent) {
  const ua = userAgent.toLowerCase()
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile'
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet'
  } else if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
    return 'desktop'
  } else if (ua.includes('bot') || ua.includes('crawler')) {
    return 'crawler'
  } else {
    return 'unknown'
  }
}
// Setup for static content with improved handling
server.use((req, res, next) => {
  // Skip static file handling for API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }

  // Extract the base path without query parameters
  const urlPath = req.path;
  
  // First try serving from the active template if available
  if (activeTemplatePath) {
    const templateFilePath = path.join(activeTemplatePath, urlPath);
    
    console.log(`Looking for file in template: ${templateFilePath}`);
    
    // Check if the requested path exists and is a file
    if (fs.existsSync(templateFilePath) && fs.statSync(templateFilePath).isFile()) {
      try {
        console.log(`Serving file from template: ${templateFilePath}`);
        // Set content type based on file extension
        setContentType(templateFilePath, res);
        return res.sendFile(templateFilePath);
      } catch (err) {
        console.error(`Access error for template file ${templateFilePath}:`, err);
      }
    } else if (fs.existsSync(templateFilePath) && fs.statSync(templateFilePath).isDirectory()) {
      // If it's a directory, check for index.html
      const indexPath = path.join(templateFilePath, 'index.html');
      if (fs.existsSync(indexPath)) {
        try {
          console.log(`Serving directory index from template: ${indexPath}`);
          setContentType(indexPath, res);
          return res.sendFile(indexPath);
        } catch (err) {
          console.error(`Access error for file ${indexPath}:`, err);
        }
      }
    }
    
    // For SPA routing, serve index.html from the template
    if (urlPath !== '/' && !urlPath.includes('.')) {
      const indexPath = path.join(activeTemplatePath, 'index.html');
      if (fs.existsSync(indexPath)) {
        try {
          console.log(`Serving SPA fallback from template: ${indexPath}`);
          setContentType(indexPath, res);
          return res.sendFile(indexPath);
        } catch (err) {
          console.error(`Access error for SPA fallback ${indexPath}:`, err);
        }
      }
    }
  }

  // Fall back to original paths (lds001Dir) if template doesn't have the file
  const filePath = path.join(lds001Dir, urlPath);
  
  // ... Rest of your existing static file serving logic ...
  
  // Your existing fallback logic
});


ipcMain.handle('select-folder', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })

  if (!canceled && filePaths.length > 0) {
    buildPath = filePaths[0] // Set the static site folder
    console.log('Serving from:', buildPath)

    // Check if folder contains index.html
    if (!fs.existsSync(path.join(buildPath, 'index.html'))) {
      console.warn(
        "Warning: Selected folder doesn't contain index.html. SPA routing may not work properly."
      )
    } else {
      console.log('Found index.html in the selected folder')
    }

    // Correctly format the URL
    return `http://localhost:${PORT}/`
  }
  return null
})

let splashWindow = null

const createSplashWindow = () => {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
    //  preload: join(__dirname, '../preload/splash-preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Load splash screen HTML
  if (process.env.NODE_ENV === 'development') {
    splashWindow.loadURL('http://localhost:5173/splash.html')
  } else {
    splashWindow.loadFile(path.join(__dirname, '../renderer/splash.html'))

  }
}

// ✅ **Electron App Initialization**
function createWindow() {
  const mainWindow = new BrowserWindow({
    minWidth: 900,
    minHeight: 600,
    width: 900,
    height: 600,
    frame: false,
    roundedCorners: true,
    autoHideMenuBar: true,
    show: false, // Keep hidden initially until fully loaded
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Main window finished loading');
  });

  ipcMain.handle('get-logs', () => getLogs())
  ipcMain.on('log-message', (event, { message, level }) => {
    console.log(`Log received: ${message}`) // Debugging
    log(message, level)
  })
  ipcMain.on('clear-logs', () => {
    saveLogs([]) // Clear the logs file
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-logs', []) // Notify frontend
    }
  })

  const userDataPath = app.getPath('userData') // Electron user data path
  const timerFilePath = path.join(userDataPath, 'timer.json') // Timer file path

  
ipcMain.handle('get-files', async (_event, dirPath = app.getPath('pictures')) => {
  const files = await fs.promises.readdir(dirPath, { withFileTypes: true });

  return files.map(file => ({
    name: file.name,
    isDirectory: file.isDirectory(),
    fullPath: path.join(dirPath, file.name),
  }));
});

  // Function to get saved time from JSON file
  function getSavedTime() {
    try {
      if (fs.existsSync(timerFilePath)) {
        const data = fs.readFileSync(timerFilePath, 'utf-8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Error reading timer file:', error)
    }
    return { remainingTime: 0, lastSaved: Date.now() }
  }

  // Function to save the timer state
  function saveTimer(remainingTime) {
    const data = { remainingTime, lastSaved: Date.now() }
    fs.writeFileSync(timerFilePath, JSON.stringify(data))
  }

  // IPC communication for timer management
  ipcMain.handle('get-timer', () => getSavedTime())
  ipcMain.handle('save-timer', (_, remainingTime) => saveTimer(remainingTime))
  ipcMain.handle('select-icon', async () => {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'svg'] }]
    })
    return filePaths[0] || ''
  })

  // Get the logs file path
  const getLogFilePath = () => {
    const logsDir = path.join(app.getPath('userData'), 'logs_x')
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir)
    return path.join(logsDir, 'logs.json')
  }

  // Read logs
  const getLogs = () => {
    const logFile = getLogFilePath()
    return fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, 'utf8')) : []
  }

  // Save logs
  const saveLogs = (logs) => {
    fs.writeFileSync(getLogFilePath(), JSON.stringify(logs, null, 2), 'utf8')
  }

  // Custom log function
  const log = (message, level = 'info') => {
    const logs = getLogs()
    const logEntry = { timestamp: new Date().toISOString(), level, message }
    logs.push(logEntry)
    saveLogs(logs)

    // Send log update to frontend
    if (mainWindow) mainWindow.webContents.send('update-logs', logEntry)
  }
  let selectedIP = 'localhost';
  let selectedPort = 80;
  function getLocalIPs() {
    const interfaces = os.networkInterfaces();
    const ips = ['localhost'];

    for (const iface of Object.values(interfaces)) {
        iface.forEach((info) => {
            if (info.family === 'IPv4' && !info.internal) {
                ips.push(info.address);
            }
        });
    }

    return ips;
}

const themeFile = path.join(app.getPath('userData'), 'theme.json');
ipcMain.handle('theme:load', () => {
  try {
    const data = fs.readFileSync(themeFile, 'utf8');
    return JSON.parse(data).theme;
  } catch {
    return 'light';
  }
});

ipcMain.handle('theme:save', (event, theme) => {
  fs.writeFileSync(themeFile, JSON.stringify({ theme }));
});

// IPC handler to send network details to main.js
ipcMain.handle('send-server-info', (event, ip, port) => {
    selectedIP = ip;
    selectedPort = port;
    console.log(`Updated Server Config: ${ip}:${port}`);
});

// Function to access the selected IP & port anywhere in `main.js`
function getCurrentServerConfig() {
    return { ip: selectedIP, port: selectedPort };
}

// IPC handler to get the selected IP & port from the frontend
ipcMain.handle('get-server-info', () => getCurrentServerConfig());

// IPC handler to get the list of IPs
ipcMain.handle('get-local-ips', () => getLocalIPs());
ipcMain.handle('open-template-in-browser', async () => {
  try {
    const { ip, port } = getCurrentServerConfig()
    const url = `http://${ip}:${port}`
    
    await shell.openExternal(url)
    return { success: true }
  } catch (error) {
    console.error('Error opening browser:', error)
    throw new Error(`Failed to open browser: ${error.message}`)
  }
})

  ipcMain.on('minimize-window', () => {
    mainWindow?.minimize()
    console.log('min')
  })

  ipcMain.on('maximize-window', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
      mainWindow.getPosition()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('closeSplashWindow', () => {
    if (splashWindow) {
      splashWindow.close()
      splashWindow = null
    }
})

  ipcMain.on('close-window', () => {
    mainWindow?.close()
  })


  ipcMain.on('start-server', () => {
      const { ip, port } = getCurrentServerConfig();
      server.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Server running at:
      - Local:   http://localhost:${port}/
      - Network: http://${ip || 'unknown'}:${port}/
      - API:     http://localhost:${port}/api/`)

      generateEndpoints()
    })
  })

  ipcMain.handle('get-security-status', () => securityEnabled)
  ipcMain.on('toggle-security', (_, status) => {
    securityEnabled = status
  })

  ipcMain.handle('check-user', async () => {
    try {
      if (fs.existsSync(APP)) {
        const data = JSON.parse(fs.readFileSync(APP, 'utf-8'))
        return data
      }
      return null
    } catch (error) {
      console.error('Error reading user data:', error)
      return null
    }
  })



  // Save user data
  ipcMain.handle('save-user', async (_, user) => {
    try {
      fs.writeFileSync(APP, JSON.stringify(user, null, 2))
      return { success: true }
    } catch (error) {
      console.error('Error saving user data:', error)
      return { success: false }
    }
  })
  let backgroundProcesses = []
  ipcMain.on('stop-processes', () => {
    backgroundProcesses.forEach(({ process, name }) => {
      console.log('Stopping', name)
      process.kill() // Terminate the process
    })
    backgroundProcesses = [] // Clear the queue
  })

  const storagePath = path.join(userDataPath, 'assets')
  const assetsFile = path.join(userDataPath, 'assets.json')

  let assets = []

  // ✅ Load saved assets on app startup
  if (fs.existsSync(assetsFile)) {
    assets = JSON.parse(fs.readFileSync(assetsFile, 'utf-8'))
  }

  function saveAssets() {
    fs.writeFileSync(assetsFile, JSON.stringify(assets, null, 2))
  }

  // ✅ Register custom protocol for accessing assets
  protocol.registerFileProtocol('app', (request, callback) => {
    const url = request.url.replace('app://asset/', '')
    const filePath = path.join(storagePath, url)
    callback({ path: filePath })
  })

  function detectDeviceType(userAgent) {
    const ua = userAgent.toLowerCase()
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile'
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet'
    } else if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
      return 'desktop'
    } else if (ua.includes('bot') || ua.includes('crawler')) {
      return 'crawler'
    } else {
      return 'unknown'
    }
  }
  
  // Add these IPC handlers near your other IPC handlers
  ipcMain.handle('get-connected-devices', () => {
    // Convert Map to array and return
    return Array.from(connectedDevices.values())
  })
  
  ipcMain.handle('block-device', (_, deviceId) => {
    if (connectedDevices.has(deviceId)) {
      const device = connectedDevices.get(deviceId)
      device.status = 'blocked'
      connectedDevices.set(deviceId, device)
      blockedDevices.add(device.ip)
      console.log(`Blocked device: ${device.ip}`)
      return { success: true }
    }
    return { success: false, error: 'Device not found' }
  })
  
  ipcMain.handle('unblock-device', (_, deviceId) => {
    if (connectedDevices.has(deviceId)) {
      const device = connectedDevices.get(deviceId)
      device.status = 'active'
      connectedDevices.set(deviceId, device)
      blockedDevices.delete(device.ip)
      console.log(`Unblocked device: ${device.ip}`)
      return { success: true }
    }
    return { success: false, error: 'Device not found' }
  })

  // ✅ Handle file import and persist assets
  ipcMain.handle('import-files', async (_, files) => {
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true })
    }

    const importedFiles = []
    for (const filePath of files) {
      const fileName = path.basename(filePath)
      const newFilePath = path.join(storagePath, fileName)

      // Copy the file only if it doesn't already exist
      if (!fs.existsSync(newFilePath)) {
        fs.copyFileSync(filePath, newFilePath)
        const asset = { name: fileName, path: `app://asset/${fileName}` }
        assets.push(asset)
        importedFiles.push(asset)
      }
    }

    // ✅ Save updated asset list
    saveAssets()
    return importedFiles
  })

  // ✅ Handle fetching assets
  ipcMain.handle('get-assets', () => assets)

  // ✅ Open file
  ipcMain.on('open-file', (event, filePath) => {
    shell.openPath(filePath)
  })

  // ✅ Copy file path
  ipcMain.on('copy-path', (event, filePath) => {
    if (clipboard) {
      clipboard.writeText(filePath)
    } else {
      console.error('Clipboard not available')
    }
  })
  mainWindow.on('ready-to-show', () => {
  
    // Show main window immediately when it's ready
  
    
    // Close splash window after exactly 10 seconds from app start
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
       mainWindow.show();
    }, 10000); // Exactly 10 seconds
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 🖥️ **App Event Listeners**
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.prutotechnologies.learningdeck.exam.manager')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))
   
  createSplashWindow();
  // Show splash immediately when ready
  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
    // Create main window immediately without delay
    createWindow();
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
});

// 🚀 **Persist Database Before App Closes**
app.on('window-all-closed', () => {
  console.log('🔄 Saving database before closing...')
  saveDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
