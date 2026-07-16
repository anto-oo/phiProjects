import {
  createNode as createNodeService,
  deleteNode as deleteNodeService,
  listNodes as listNodesService,
  updateNode as updateNodeService,
} from '../services/plannerService.js'

export async function listNodes(req, res, next) {
  try {
    const nodes = await listNodesService(req.query.projectId)
    res.json(nodes)
  } catch (error) {
    next(error)
  }
}

export async function createNode(req, res, next) {
  try {
    const node = await createNodeService(req.body)
    return res.status(201).json(node)
  } catch (error) {
    return next(error)
  }
}

export async function updateNode(req, res, next) {
  try {
    const node = await updateNodeService(req.params.id, req.body)
    return res.json(node)
  } catch (error) {
    return next(error)
  }
}

export async function deleteNode(req, res, next) {
  try {
    await deleteNodeService(req.params.id)
    res.status(204).send()
  } catch (error) {
    return next(error)
  }
}
