import prisma from '../prisma/client.js'

export async function listProjects(req, res, next) {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        nodes: {
          orderBy: [{ order: 'asc' }, { title: 'asc' }],
          include: {
            outgoingDependencies: true,
            incomingDependencies: true,
          },
        },
      },
    })
    res.json(projects)
  } catch (error) {
    next(error)
  }
}

export async function getProject(req, res, next) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        nodes: {
          orderBy: [{ order: 'asc' }, { title: 'asc' }],
          include: {
            outgoingDependencies: true,
            incomingDependencies: true,
          },
        },
      },
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    return res.json(project)
  } catch (error) {
    return next(error)
  }
}

export async function createProject(req, res, next) {
  try {
    const { name } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Project name is required' })
    }

    const project = await prisma.project.create({
      data: { name: name.trim() },
      include: { nodes: true },
    })

    return res.status(201).json(project)
  } catch (error) {
    return next(error)
  }
}

export async function updateProject(req, res, next) {
  try {
    const { name } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Project name is required' })
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { name: name.trim() },
      include: { nodes: true },
    })

    return res.json(project)
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Project not found' })
    }
    return next(error)
  }
}

export async function deleteProject(req, res, next) {
  try {
    await prisma.project.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Project not found' })
    }
    return next(error)
  }
}
