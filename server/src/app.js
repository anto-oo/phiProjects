import express from 'express'
import cors from 'cors'
import projectsRoutes from './routes/projects.js'
import nodesRoutes from './routes/nodes.js'

const app = express()
const port = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/projects', projectsRoutes)
app.use('/api/nodes', nodesRoutes)

app.use((err, req, res, next) => {
  if (err.status) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code ?? 'REQUEST_ERROR',
    })
  }
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
