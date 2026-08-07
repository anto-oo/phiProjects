import { create } from 'zustand'
import { api } from '../services/api'

const statusMap = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  blocked: 'Blocked',
}

const priorityMap = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const statusOptions = Object.keys(statusMap)
export const priorityOptions = Object.keys(priorityMap)

export const usePlannerStore = create((set, get) => ({
  projects: [],
  selectedProjectId: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    priority: 'all',
  },

  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),

  loadProjects: async () => {
    set({ loading: true, error: null })
    try {
      let projects = await api.listProjects()
      if (projects.length === 0) {
        const created = await api.createProject('Main Project')
        projects = [{ ...created, nodes: [] }]
      }

      set((state) => ({
        projects,
        selectedProjectId: state.selectedProjectId ?? projects[0]?.id ?? null,
        loading: false,
      }))
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  selectProject: (id) => set({ selectedProjectId: id }),

  createProject: async (name) => {
    const project = await api.createProject(name)
    set((state) => ({
      projects: [...state.projects, { ...project, nodes: [] }],
      selectedProjectId: project.id,
    }))
  },

  getSelectedProject: () => get().projects.find((project) => project.id === get().selectedProjectId) ?? null,

  upsertNode: (node) => {
    set((state) => ({
      projects: state.projects.map((project) => {
        if (project.id !== node.projectId) return project
        const existing = project.nodes.find((item) => item.id === node.id)
        const nodes = existing
          ? project.nodes.map((item) => (item.id === node.id ? node : item))
          : [...project.nodes, node]
        return { ...project, nodes }
      }),
    }))
  },

  createNode: async (payload) => {
    const node = await api.createNode(payload)
    get().upsertNode(node)
  },

  updateNode: async (id, payload) => {
    const node = await api.updateNode(id, payload)
    get().upsertNode(node)
  },

  deleteNode: async (id) => {
    await api.deleteNode(id)
    set((state) => ({
      projects: state.projects.map((project) => ({
        ...project,
        nodes: (() => {
          const childrenByParent = project.nodes.reduce((acc, node) => {
            const key = node.parentId ?? '__root__'
            if (!acc[key]) acc[key] = []
            acc[key].push(node.id)
            return acc
          }, {})

          const removedIds = new Set([id])
          const queue = [id]

          while (queue.length > 0) {
            const current = queue.shift()
            const children = childrenByParent[current] ?? []
            children.forEach((childId) => {
              if (!removedIds.has(childId)) {
                removedIds.add(childId)
                queue.push(childId)
              }
            })
          }

          return project.nodes.filter((node) => !removedIds.has(node.id))
        })(),
      })),
    }))
  },

  moveNode: async (draggedNodeId, targetNodeId) => {
    const project = get().getSelectedProject()
    if (!project || draggedNodeId === targetNodeId) return

    const draggedNode = project.nodes.find((node) => node.id === draggedNodeId)
    const targetNode = project.nodes.find((node) => node.id === targetNodeId)
    if (!draggedNode || !targetNode) return

    const siblings = project.nodes.filter((node) => node.parentId === targetNode.id)
    const nextOrder = siblings.length

    await get().updateNode(draggedNode.id, {
      ...draggedNode,
      parentId: targetNode.id,
      order: nextOrder,
      dependencyIds: draggedNode.incomingDependencies?.map((dep) => dep.blockingNodeId) ?? [],
    })
  },

  updateNodeStatus: async (node, status) => {
    await get().updateNode(node.id, {
      ...node,
      status,
      dependencyIds: node.incomingDependencies?.map((dep) => dep.blockingNodeId) ?? [],
    })
  },

  getFilteredNodes: () => {
    const state = get()
    const project = state.getSelectedProject()
    if (!project) return []

    const search = state.filters.search.toLowerCase()

    return project.nodes.filter((node) => {
      const searchMatch = search.length === 0 || node.title.toLowerCase().includes(search)
      const statusMatch = state.filters.status === 'all' || node.status === state.filters.status
      const priorityMatch = state.filters.priority === 'all' || node.priority === state.filters.priority
      return searchMatch && statusMatch && priorityMatch
    })
  },

  maps: {
    statusMap,
    priorityMap,
  },
}))
