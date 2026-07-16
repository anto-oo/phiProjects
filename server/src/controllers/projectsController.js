import {
  createProject as createProjectService,
  deleteProject as deleteProjectService,
  getProject as getProjectService,
  listProjects as listProjectsService,
  updateProject as updateProjectService,
} from '../services/plannerService.js'

export async function listProjects(req, res, next) {
  try {
    const projects = await listProjectsService()
    res.json(projects)
  } catch (error) {
    next(error)
  }
}

export async function getProject(req, res, next) {
  try {
    const project = await getProjectService(req.params.id)
    return res.json(project)
  } catch (error) {
    return next(error)
  }
}

export async function createProject(req, res, next) {
  try {
    const project = await createProjectService(req.body.name)
    return res.status(201).json(project)
  } catch (error) {
    return next(error)
  }
}

export async function updateProject(req, res, next) {
  try {
    const project = await updateProjectService(req.params.id, req.body.name)
    return res.json(project)
  } catch (error) {
    return next(error)
  }
}

export async function deleteProject(req, res, next) {
  try {
    await deleteProjectService(req.params.id)
    res.status(204).send()
  } catch (error) {
    return next(error)
  }
}
