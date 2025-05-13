import os from 'os'
import fs from 'fs-extra'
import path from 'path'
import { app } from 'electron'

// Config defaults
let serverConfig = {
  ip: 'localhost',
  port: 80
}

const themeFile = path.join(app.getPath('userData'), 'theme.json')
const configFile = path.join(app.getPath('userData'), 'config.json')

/**
 * Initialize configuration on startup
 */
export function initializeConfig() {
  try {
    if (fs.existsSync(configFile)) {
      const savedConfig = fs.readJSONSync(configFile)
      serverConfig = { ...serverConfig, ...savedConfig }
    }
  } catch (error) {
    console.error('Error loading configuration:', error)
  }
}

/**
 * Save current configuration
 */
export function saveConfig() {
  try {
    fs.writeJSONSync(configFile, serverConfig, { spaces: 2 })
  } catch (error) {
    console.error('Error saving configuration:', error)
  }
}

/**
 * Get server configuration
 */
export function getCurrentServerConfig() {
  return { ...serverConfig }
}

/**
 * Set server configuration
 */
export function setServerConfig(ip, port) {
  serverConfig.ip = ip
  serverConfig.port = port
  saveConfig()
}

/**
 * Get available local IP addresses
 */
export function getLocalIPs() {
  const interfaces = os.networkInterfaces()
  const ips = ['localhost']

  for (const iface of Object.values(interfaces)) {
    iface.forEach((info) => {
      if (info.family === 'IPv4' && !info.internal) {
        ips.push(info.address)
      }
    })
  }

  return ips
}

/**
 * Get theme configuration
 */
export function getTheme() {
  try {
    if (fs.existsSync(themeFile)) {
      const data = fs.readFileSync(themeFile, 'utf8')
      return JSON.parse(data).theme
    }
  } catch (error) {
    console.error('Error reading theme:', error)
  }
  return 'light'
}

/**
 * Save theme configuration
 */
export function saveTheme(theme) {
  try {
    fs.writeFileSync(themeFile, JSON.stringify({ theme }))
  } catch (error) {
    console.error('Error saving theme:', error)
  }
}