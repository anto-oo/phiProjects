import prisma from '../prisma/client.js'

const NODE_INCLUDE = {
  outgoingDependencies: true,
  incomingDependencies: true,
}

const TREE_ORDER = [{ order: 'asc' }, { title: 'asc' }]
const ALLOWED_NODE_TYPES = new Set(['epic', 'feature', 'task'])

export class PlannerServiceError extends Error {
  constructor(status, message, code = 'PLANNER_ERROR') {
    super(message)
    this.name = 'PlannerServiceError'
    this.status = status
    this.code = code
  }
}

function sanitizeText(value) {
  return typeof value === 'string' ? value.trim() : value
}

function parseDateValue(value, fieldName) {
  if (value === null) return null
  if (value === undefined) return undefined

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new PlannerServiceError(400, `Invalid ${fieldName}`, 'VALIDATION_ERROR')
  }

  return parsed
}

async function ensureProjectExists(projectId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    throw new PlannerServiceError(404, 'Project not found', 'PROJECT_NOT_FOUND')
  }
  return project
}

async function ensureNodeExists(nodeId) {
  const node = await prisma.node.findUnique({
    where: { id: nodeId },
    include: NODE_INCLUDE,
  })

  if (!node) {
    throw new PlannerServiceError(404, 'Node not found', 'NODE_NOT_FOUND')
  }

  return node
}

async function ensureParentValid(projectId, nodeId, parentId) {
  if (parentId === undefined) return
  if (parentId === null) return

  if (nodeId && parentId === nodeId) {
    throw new PlannerServiceError(400, 'A node cannot be parent of itself', 'INVALID_PARENT')
  }

  const parent = await prisma.node.findUnique({ where: { id: parentId } })
  if (!parent) {
    throw new PlannerServiceError(404, 'Parent node not found', 'NODE_NOT_FOUND')
  }

  if (parent.projectId !== projectId) {
    throw new PlannerServiceError(400, 'Parent node must belong to same project', 'INVALID_PARENT')
  }

  if (!nodeId) return

  const nodes = await prisma.node.findMany({
    where: { projectId },
    select: { id: true, parentId: true },
  })

  const parentById = new Map(nodes.map((item) => [item.id, item.parentId]))
  let cursor = parentId

  while (cursor) {
    if (cursor === nodeId) {
      throw new PlannerServiceError(400, 'Cannot move node under one of its descendants', 'INVALID_PARENT')
    }
    cursor = parentById.get(cursor) ?? null
  }
}

async function syncDependencies(nodeId, dependencyIds = []) {
  await prisma.nodeDependency.deleteMany({ where: { blockedNodeId: nodeId } })

  const deduped = [...new Set(dependencyIds)].filter((id) => id !== nodeId)

  if (deduped.length === 0) {
    return
  }

  const availableDependencies = await prisma.node.findMany({
    where: { id: { in: deduped } },
    select: { id: true },
  })

  const existingIds = new Set(availableDependencies.map((item) => item.id))
  const invalidId = deduped.find((id) => !existingIds.has(id))

  if (invalidId) {
    throw new PlannerServiceError(404, `Dependency node not found: ${invalidId}`, 'NODE_NOT_FOUND')
  }

  await prisma.nodeDependency.createMany({
    data: deduped.map((blockingNodeId) => ({
      blockedNodeId: nodeId,
      blockingNodeId,
    })),
  })
}

function normalizeCreatePayload(payload) {
  const title = sanitizeText(payload.title)
  const type = payload.type ?? 'task'

  if (!title) {
    throw new PlannerServiceError(400, 'title is required', 'VALIDATION_ERROR')
  }

  if (!payload.projectId) {
    throw new PlannerServiceError(400, 'projectId is required', 'VALIDATION_ERROR')
  }

  if (!ALLOWED_NODE_TYPES.has(type)) {
    throw new PlannerServiceError(400, 'type must be one of: epic, feature, task', 'VALIDATION_ERROR')
  }

  return {
    title,
    description: payload.description ?? null,
    type,
    status: payload.status ?? 'backlog',
    priority: payload.priority ?? 'medium',
    startDate: parseDateValue(payload.startDate, 'startDate') ?? null,
    endDate: parseDateValue(payload.endDate, 'endDate') ?? null,
    parentId: payload.parentId ?? null,
    projectId: payload.projectId,
    order: Number.isInteger(payload.order) ? payload.order : 0,
  }
}

function normalizeUpdatePayload(payload) {
  const data = {}

  if ('title' in payload) {
    const title = sanitizeText(payload.title)
    if (!title) {
      throw new PlannerServiceError(400, 'title cannot be empty', 'VALIDATION_ERROR')
    }
    data.title = title
  }

  if ('description' in payload) data.description = payload.description
  if ('type' in payload) {
    if (!ALLOWED_NODE_TYPES.has(payload.type)) {
      throw new PlannerServiceError(400, 'type must be one of: epic, feature, task', 'VALIDATION_ERROR')
    }
    data.type = payload.type
  }
  if ('status' in payload) data.status = payload.status
  if ('priority' in payload) data.priority = payload.priority
  if ('startDate' in payload) data.startDate = parseDateValue(payload.startDate, 'startDate')
  if ('endDate' in payload) data.endDate = parseDateValue(payload.endDate, 'endDate')
  if ('parentId' in payload) data.parentId = payload.parentId
  if ('order' in payload) {
    if (!Number.isInteger(payload.order)) {
      throw new PlannerServiceError(400, 'order must be an integer', 'VALIDATION_ERROR')
    }
    data.order = payload.order
  }

  return data
}

export async function listProjects() {
  return prisma.project.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      nodes: {
        orderBy: TREE_ORDER,
        include: NODE_INCLUDE,
      },
    },
  })
}

export async function getProject(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      nodes: {
        orderBy: TREE_ORDER,
        include: NODE_INCLUDE,
      },
    },
  })

  if (!project) {
    throw new PlannerServiceError(404, 'Project not found', 'PROJECT_NOT_FOUND')
  }

  return project
}

export async function createProject(name) {
  const trimmed = sanitizeText(name)
  if (!trimmed) {
    throw new PlannerServiceError(400, 'Project name is required', 'VALIDATION_ERROR')
  }

  return prisma.project.create({
    data: { name: trimmed },
    include: { nodes: true },
  })
}

export async function updateProject(projectId, name) {
  const trimmed = sanitizeText(name)
  if (!trimmed) {
    throw new PlannerServiceError(400, 'Project name is required', 'VALIDATION_ERROR')
  }

  try {
    return await prisma.project.update({
      where: { id: projectId },
      data: { name: trimmed },
      include: { nodes: true },
    })
  } catch (error) {
    if (error.code === 'P2025') {
      throw new PlannerServiceError(404, 'Project not found', 'PROJECT_NOT_FOUND')
    }
    throw error
  }
}

export async function deleteProject(projectId) {
  try {
    await prisma.project.delete({ where: { id: projectId } })
  } catch (error) {
    if (error.code === 'P2025') {
      throw new PlannerServiceError(404, 'Project not found', 'PROJECT_NOT_FOUND')
    }
    throw error
  }
}

export async function listNodes(projectId) {
  const where = projectId ? { projectId } : undefined
  return prisma.node.findMany({
    where,
    orderBy: TREE_ORDER,
    include: NODE_INCLUDE,
  })
}

export async function createNode(payload) {
  const data = normalizeCreatePayload(payload)

  await ensureProjectExists(data.projectId)
  await ensureParentValid(data.projectId, null, data.parentId)

  const node = await prisma.node.create({
    data,
    include: NODE_INCLUDE,
  })

  await syncDependencies(node.id, payload.dependencyIds)

  return prisma.node.findUnique({
    where: { id: node.id },
    include: NODE_INCLUDE,
  })
}

export async function updateNode(nodeId, payload) {
  const existing = await ensureNodeExists(nodeId)
  const data = normalizeUpdatePayload(payload)

  if ('parentId' in data) {
    await ensureParentValid(existing.projectId, nodeId, data.parentId)
  }

  try {
    await prisma.node.update({
      where: { id: nodeId },
      data,
    })
  } catch (error) {
    if (error.code === 'P2025') {
      throw new PlannerServiceError(404, 'Node not found', 'NODE_NOT_FOUND')
    }
    throw error
  }

  if (Array.isArray(payload.dependencyIds)) {
    await syncDependencies(nodeId, payload.dependencyIds)
  }

  return prisma.node.findUnique({
    where: { id: nodeId },
    include: NODE_INCLUDE,
  })
}

export async function moveNode(nodeId, newParentId, newOrder) {
  if (!Number.isInteger(newOrder)) {
    throw new PlannerServiceError(400, 'newOrder must be an integer', 'VALIDATION_ERROR')
  }

  return updateNode(nodeId, { parentId: newParentId, order: newOrder })
}

export async function deleteNode(nodeId) {
  const existing = await ensureNodeExists(nodeId)
  const nodes = await prisma.node.findMany({
    where: { projectId: existing.projectId },
    select: { id: true, parentId: true },
  })

  const childrenByParent = new Map()
  nodes.forEach((node) => {
    const key = node.parentId ?? '__root__'
    const bucket = childrenByParent.get(key) ?? []
    bucket.push(node.id)
    childrenByParent.set(key, bucket)
  })

  const toDelete = [nodeId]
  for (let index = 0; index < toDelete.length; index += 1) {
    const current = toDelete[index]
    const children = childrenByParent.get(current) ?? []
    toDelete.push(...children)
  }

  await prisma.node.deleteMany({
    where: { id: { in: toDelete } },
  })

  return { deletedNodeIds: toDelete }
}

export async function getProjectTree(projectId) {
  const project = await getProject(projectId)

  const nodeMap = new Map(
    project.nodes.map((node) => [
      node.id,
      {
        ...node,
        children: [],
      },
    ]),
  )

  const roots = []
  project.nodes.forEach((node) => {
    const current = nodeMap.get(node.id)
    if (!node.parentId || !nodeMap.has(node.parentId)) {
      roots.push(current)
      return
    }
    nodeMap.get(node.parentId).children.push(current)
  })

  return {
    project: {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
    },
    tree: roots,
  }
}

export async function searchNodes(projectId, query, filters = {}) {
  await ensureProjectExists(projectId)

  const normalizedQuery = sanitizeText(query)
  const where = { projectId, AND: [] }

  if (normalizedQuery) {
    where.AND.push({
      OR: [
        { title: { contains: normalizedQuery } },
        { description: { contains: normalizedQuery } },
      ],
    })
  }

  if (filters.status) {
    where.AND.push(
      Array.isArray(filters.status)
        ? { status: { in: filters.status } }
        : { status: filters.status },
    )
  }

  if (filters.priority) {
    where.AND.push(
      Array.isArray(filters.priority)
        ? { priority: { in: filters.priority } }
        : { priority: filters.priority },
    )
  }

  if (where.AND.length === 0) {
    delete where.AND
  }

  return prisma.node.findMany({
    where,
    orderBy: TREE_ORDER,
    include: NODE_INCLUDE,
  })
}
