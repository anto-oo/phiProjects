import prisma from '../prisma/client.js'

function sanitizeNodePayload(payload) {
  return {
    title: payload.title?.trim(),
    description: payload.description ?? null,
    type: payload.type ?? 'task',
    status: payload.status ?? 'backlog',
    priority: payload.priority ?? 'medium',
    startDate: payload.startDate ? new Date(payload.startDate) : null,
    endDate: payload.endDate ? new Date(payload.endDate) : null,
    parentId: payload.parentId ?? null,
    projectId: payload.projectId,
    order: Number.isInteger(payload.order) ? payload.order : 0,
  }
}

async function syncDependencies(nodeId, dependencyIds = []) {
  await prisma.nodeDependency.deleteMany({ where: { blockedNodeId: nodeId } })

  const deduped = [...new Set(dependencyIds)].filter((id) => id !== nodeId)

  if (deduped.length === 0) {
    return
  }

  await prisma.nodeDependency.createMany({
    data: deduped.map((blockingNodeId) => ({
      blockedNodeId: nodeId,
      blockingNodeId,
    })),
  })
}

export async function listNodes(req, res, next) {
  try {
    const where = req.query.projectId ? { projectId: req.query.projectId } : undefined
    const nodes = await prisma.node.findMany({
      where,
      orderBy: [{ order: 'asc' }, { title: 'asc' }],
      include: {
        outgoingDependencies: true,
        incomingDependencies: true,
      },
    })
    res.json(nodes)
  } catch (error) {
    next(error)
  }
}

export async function createNode(req, res, next) {
  try {
    const data = sanitizeNodePayload(req.body)
    if (!data.title || !data.projectId) {
      return res.status(400).json({ error: 'title and projectId are required' })
    }

    const node = await prisma.node.create({
      data,
      include: {
        outgoingDependencies: true,
        incomingDependencies: true,
      },
    })

    await syncDependencies(node.id, req.body.dependencyIds)

    const updated = await prisma.node.findUnique({
      where: { id: node.id },
      include: {
        outgoingDependencies: true,
        incomingDependencies: true,
      },
    })

    return res.status(201).json(updated)
  } catch (error) {
    return next(error)
  }
}

export async function updateNode(req, res, next) {
  try {
    const data = sanitizeNodePayload(req.body)
    delete data.projectId

    const node = await prisma.node.update({
      where: { id: req.params.id },
      data,
      include: {
        outgoingDependencies: true,
        incomingDependencies: true,
      },
    })

    if (Array.isArray(req.body.dependencyIds)) {
      await syncDependencies(node.id, req.body.dependencyIds)
    }

    const updated = await prisma.node.findUnique({
      where: { id: node.id },
      include: {
        outgoingDependencies: true,
        incomingDependencies: true,
      },
    })

    return res.json(updated)
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Node not found' })
    }
    return next(error)
  }
}

export async function deleteNode(req, res, next) {
  try {
    await prisma.node.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Node not found' })
    }
    return next(error)
  }
}
