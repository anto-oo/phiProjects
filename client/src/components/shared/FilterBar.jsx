import { priorityOptions, statusOptions, usePlannerStore } from '../../store/plannerStore'

export function FilterBar() {
  const filters = usePlannerStore((state) => state.filters)
  const setFilters = usePlannerStore((state) => state.setFilters)

  return (
    <div className="grid gap-2 rounded-lg bg-white p-3 shadow sm:grid-cols-3">
      <input
        className="rounded border border-slate-300 px-3 py-2"
        placeholder="Search title..."
        value={filters.search}
        onChange={(event) => setFilters({ search: event.target.value })}
      />
      <select
        className="rounded border border-slate-300 px-3 py-2"
        value={filters.status}
        onChange={(event) => setFilters({ status: event.target.value })}
      >
        <option value="all">All statuses</option>
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <select
        className="rounded border border-slate-300 px-3 py-2"
        value={filters.priority}
        onChange={(event) => setFilters({ priority: event.target.value })}
      >
        <option value="all">All priorities</option>
        {priorityOptions.map((priority) => (
          <option key={priority} value={priority}>
            {priority}
          </option>
        ))}
      </select>
    </div>
  )
}
