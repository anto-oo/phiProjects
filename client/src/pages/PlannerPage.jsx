import { useEffect, useState } from 'react'
import { FeatureTree } from '../components/FeatureTree/FeatureTree'
import { GanttChart } from '../components/GanttChart/GanttChart'
import { KanbanBoard } from '../components/KanbanBoard/KanbanBoard'
import { FilterBar } from '../components/shared/FilterBar'
import { usePlannerStore } from '../store/plannerStore'

const views = [
  { id: 'tree', label: 'Feature Tree' },
  { id: 'kanban', label: 'Kanban' },
  { id: 'gantt', label: 'Gantt' },
]

export function PlannerPage() {
  const [view, setView] = useState('tree')
  const loadProjects = usePlannerStore((state) => state.loadProjects)
  const projects = usePlannerStore((state) => state.projects)
  const selectedProjectId = usePlannerStore((state) => state.selectedProjectId)
  const selectProject = usePlannerStore((state) => state.selectProject)
  const createProject = usePlannerStore((state) => state.createProject)
  const loading = usePlannerStore((state) => state.loading)
  const error = usePlannerStore((state) => state.error)

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  return (
    <main className="mx-auto max-w-7xl space-y-4 p-4">
      <header className="rounded-lg bg-white p-4 shadow">
        <h1 className="text-2xl font-bold">Project Planner</h1>
        <p className="text-sm text-slate-600">Single data source for tree, kanban and timeline views.</p>
      </header>

      <section className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 shadow">
        <select
          className="rounded border border-slate-300 px-3 py-2"
          value={selectedProjectId ?? ''}
          onChange={(event) => selectProject(event.target.value)}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <button
          className="rounded border border-slate-300 px-3 py-2"
          onClick={() => {
            const name = window.prompt('Project name')
            if (name?.trim()) createProject(name)
          }}
        >
          New project
        </button>
      </section>

      <FilterBar />

      <nav className="flex gap-2">
        {views.map((item) => (
          <button
            key={item.id}
            className={`rounded px-3 py-2 text-sm ${view === item.id ? 'bg-blue-600 text-white' : 'bg-white'}`}
            onClick={() => setView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && view === 'tree' && <FeatureTree />}
      {!loading && !error && view === 'kanban' && <KanbanBoard />}
      {!loading && !error && view === 'gantt' && <GanttChart />}
    </main>
  )
}
