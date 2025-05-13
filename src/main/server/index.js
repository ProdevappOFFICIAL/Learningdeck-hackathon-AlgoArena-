import express from 'express'
import cors from 'cors'
import { generateEndpoints } from './api.js'
import { setupStaticFileHandling } from './static.js'
import { securityMiddleware } from './middleware.js'
import { getCurrentServerConfig } from '../utils/config.js'

// Express server instance
const server = express()

/**
 * Configures and starts the Express server
 */
export function startServer() {
  // Basic middlewares
  server.use(express.json())
  server.use(cors())
  
  // Request logging middleware
  server.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`)
    console.log(`Path: ${req.path}, Query:`, req.query)
    next()
  })
  
  // API security middleware
  server.use('/api', securityMiddleware)
  
  // Root route handler
  server.get('/', (req, res) => {
    res.send(`
      <h1>Welcome to your Electron App Server</h1>
      <p>Available endpoints:</p>
      <ul>
        <li>API: <a href="/api">/api</a> (followed by resource name)</li>
        <li>Web: <a href="/">Root path</a> (Static content)</li>
      </ul>
    `)
  })
  
  // Set up static file handling
  setupStaticFileHandling(server)
  
  // Generate API endpoints
  generateEndpoints(server)
  
  // Start the server
  const { ip, port } = getCurrentServerConfig()
  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running at:
    - Local:   http://localhost:${port}/
    - Network: http://${ip || 'unknown'}:${port}/
    - API:     http://localhost:${port}/api/`)
  })
  
  return server
}

/**
 * Returns the Express server instance
 */
export function getServer() {
  return server
}