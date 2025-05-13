import _ from 'lodash'
import { getDatabase } from '../utils/database.js'
import { saveDatabase } from '../utils/database.js'

/**
 * Generates RESTful API endpoints for each resource in the database
 * @param {Express} server - The Express server instance
 */
export function generateEndpoints(server) {
  const db = getDatabase()
  
  Object.keys(db).forEach((resource) => {
    const resourcePath = `/api/${resource}`

    // GET all items
    server.get(resourcePath, (req, res) => {
      let data = db[resource]
      
      // Handle query filters
      const query = req.query
      Object.keys(query).forEach((key) => {
        if (!key.startsWith('_')) {
          data = data.filter((item) => String(item[key]) === String(query[key]))
        }
      })

      // Handle sorting
      if (query._sort) {
        data = _.orderBy(data, query._sort, query._order || 'asc')
      }
      
      // Handle limit
      if (query._limit) {
        data = data.slice(0, Number(query._limit))
      }

      res.json(data)
    })

    // GET item by ID
    server.get(`${resourcePath}/:id`, (req, res) => {
      const item = db[resource].find((item) => item.id == req.params.id)
      item ? res.json(item) : res.status(404).json({ error: 'Not found' })
    })

    // POST new item
    server.post(resourcePath, (req, res) => {
      const resourceData = db[resource]
      const newId =
        resourceData.length > 0 ? Math.max(...resourceData.map((item) => item.id)) + 1 : 1

      const newItem = { id: newId, ...req.body }
      resourceData.push(newItem)
      saveDatabase()
      res.status(201).json(newItem)
    })

    // PUT (update) item
    server.put(`${resourcePath}/:id`, (req, res) => {
      const index = db[resource].findIndex((item) => item.id == req.params.id)
      if (index === -1) return res.status(404).json({ error: 'Not found' })

      db[resource][index] = { ...db[resource][index], ...req.body }
      saveDatabase()
      res.json(db[resource][index])
    })

    // DELETE item
    server.delete(`${resourcePath}/:id`, (req, res) => {
      db[resource] = db[resource].filter((item) => item.id != req.params.id)
      saveDatabase()
      res.status(204).send()
    })
  })
}