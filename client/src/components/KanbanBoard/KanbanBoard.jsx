import { useState } from 'react'
import { usePlannerData } from '../../hooks/usePlannerData'
import { usePlannerStore } from '../../store/plannerStore'
import { NodeEditor } from '../shared/NodeEditor'

const columns = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'in_review', label: 'Review' },
  { id: 'done', label: 'Done' },
]

export function KanbanBoard() {
  const { filteredNodes } = usePlannerData()
  const updateNodeStatus = usePlannerStore((state) => state.updateNodeStatus)
  const [editorNode, setEditorNode] = useState(undefined)

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Kanban</h2>
      <div className="grid gap-3 lg:grid-cols-4">
        {columns.map((column) => {
          const nodes = filteredNodes.filter((node) => node.status === column.id)

          return (
            <div
              key={column.id}
              className="rounded border border-slate-200 bg-white p-2"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                const nodeId = event.dataTransfer.getData('text/node-id')
                const node = filteredNodes.find((item) => item.id === nodeId)
                if (node) {
                  updateNodeStatus(node, column.id)
                }
              }}
            >
              <h3 className="mb-2 text-sm font-semibold">{column.label}</h3>
              <div className="space-y-2">
                {nodes.map((node) => (
                  <button
                    type="button"
                    key={node.id}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData('text/node-id', node.id)}
                    onClick={() => setEditorNode(node)}
                    className="block w-full rounded border border-slate-200 bg-slate-50 p-2 text-left"
                  >
                    <p className="font-medium">{node.title}</p>
                    <p className="text-xs text-slate-500">{node.priority}</p>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {editorNode !== undefined && <NodeEditor node={editorNode} onClose={() => setEditorNode(undefined)} />}
    </section>
  )
}
