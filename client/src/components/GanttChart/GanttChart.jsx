import { useMemo, useState } from 'react'
import { usePlannerData } from '../../hooks/usePlannerData'

const zoomModes = {
  days: 18,
  weeks: 4,
  months: 1,
}

function dayDiff(a, b) {
  const oneDay = 24 * 60 * 60 * 1000
  return Math.round((a.getTime() - b.getTime()) / oneDay)
}

export function GanttChart() {
  const { filteredNodes } = usePlannerData()
  const [zoom, setZoom] = useState('days')

  const withDates = useMemo(
    () => filteredNodes.filter((node) => node.startDate && node.endDate).sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [filteredNodes],
  )

  const minStart = withDates.length ? new Date(withDates[0].startDate) : new Date()

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Timeline / Gantt</h2>
        <select
          className="rounded border border-slate-300 px-2 py-1"
          value={zoom}
          onChange={(event) => setZoom(event.target.value)}
        >
          <option value="days">Days</option>
          <option value="weeks">Weeks</option>
          <option value="months">Months</option>
        </select>
      </div>
      <div className="space-y-2 rounded border border-slate-200 bg-white p-3">
        {withDates.length === 0 && <p className="text-sm text-slate-500">Set start/end dates in nodes to render the timeline.</p>}
        {withDates.map((node) => {
          const start = new Date(node.startDate)
          const end = new Date(node.endDate)
          const left = dayDiff(start, minStart) / zoomModes[zoom]
          const width = Math.max(14, dayDiff(end, start) / zoomModes[zoom] * 12)
          const deps = node.incomingDependencies?.length ?? 0

          return (
            <div key={node.id} className="grid grid-cols-[220px_1fr] items-center gap-2">
              <div>
                <p className="truncate text-sm font-medium">{node.title}</p>
                <p className="text-xs text-slate-500">Dependencies: {deps}</p>
              </div>
              <div className="relative h-8 rounded bg-slate-100">
                <div
                  className="absolute top-1 h-6 rounded bg-blue-500"
                  style={{ left: `${left}px`, width: `${width}px` }}
                  title={`${node.startDate.slice(0, 10)} → ${node.endDate.slice(0, 10)}`}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
