const defaultHeaders = {
  'Content-Type': 'application/json',
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(errorData.error || 'Request failed')
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const api = {
  listProjects: () => request('/api/projects'),
  createProject: (name) => request('/api/projects', { method: 'POST', body: JSON.stringify({ name }) }),
  updateProject: (id, name) => request(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteProject: (id) => request(`/api/projects/${id}`, { method: 'DELETE' }),
  createNode: (payload) => request('/api/nodes', { method: 'POST', body: JSON.stringify(payload) }),
  updateNode: (id, payload) => request(`/api/nodes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteNode: (id) => request(`/api/nodes/${id}`, { method: 'DELETE' }),
}
