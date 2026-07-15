import { useState } from 'react'
import { priorityOptions, statusOptions, usePlannerStore } from '../../store/plannerStore'

export function NodeEditor({ node, onClose }) {
  const project = usePlannerStore((state) => state.getSelectedProject())
  const createNode = usePlannerStore((state) => state.createNode)
  const updateNode = usePlannerStore((state) => state.updateNode)

  const dependencyCandidates = (project?.nodes ?? []).filter((candidate) => candidate.id !== node?.id)

  const [form, setForm] = useState({
    title: node?.title ?? '',
    description: node?.description ?? '',
    type: node?.type ?? 'task',
    status: node?.status ?? 'todo',
    priority: node?.priority ?? 'medium',
    startDate: node?.startDate ? node.startDate.slice(0, 10) : '',
    endDate: node?.endDate ? node.endDate.slice(0, 10) : '',
    parentId: node?.parentId ?? '',
    dependencyIds: node?.incomingDependencies?.map((dep) => dep.blockingNodeId) ?? [],
  })

  const save = async (event) => {
    event.preventDefault()

    const payload = {
      ...form,
      projectId: project.id,
      parentId: form.parentId || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      order: node?.order ?? 0,
    }

    if (node?.id) {
      await updateNode(node.id, payload)
    } else {
      await createNode(payload)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
      <form className="w-full max-w-xl space-y-2 rounded-lg bg-white p-4" onSubmit={save}>
        <h3 className="text-lg font-semibold">{node ? 'Edit node' : 'Create node'}</h3>
        <input
          required
          className="w-full rounded border border-slate-300 px-3 py-2"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="Title"
        />
        <textarea
          className="w-full rounded border border-slate-300 px-3 py-2"
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Description"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            className="rounded border border-slate-300 px-3 py-2"
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-slate-300 px-3 py-2"
            value={form.priority}
            onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
          >
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="date"
            className="rounded border border-slate-300 px-3 py-2"
            value={form.startDate}
            onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
          />
          <input
            type="date"
            className="rounded border border-slate-300 px-3 py-2"
            value={form.endDate}
            onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
          />
        </div>
        <input
          className="w-full rounded border border-slate-300 px-3 py-2"
          value={form.type}
          onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
          placeholder="Type (epic, feature, task)"
        />
        <select
          className="w-full rounded border border-slate-300 px-3 py-2"
          value={form.parentId}
          onChange={(event) => setForm((prev) => ({ ...prev, parentId: event.target.value }))}
        >
          <option value="">No parent</option>
          {dependencyCandidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.title}
            </option>
          ))}
        </select>
        <label className="block text-sm font-medium">Dependencies (blocked by)</label>
        <select
          multiple
          className="h-28 w-full rounded border border-slate-300 px-2 py-2"
          value={form.dependencyIds}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              dependencyIds: Array.from(event.target.selectedOptions).map((option) => option.value),
            }))
          }
        >
          {dependencyCandidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.title}
            </option>
          ))}
        </select>
        <div className="flex justify-end gap-2">
          <button type="button" className="rounded border px-3 py-2" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="rounded bg-blue-600 px-3 py-2 text-white">
            Save
          </button>
        </div>
      </form>
    </div>
  )
}
