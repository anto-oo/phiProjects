import { useState } from 'react'
import { usePlannerData } from '../../hooks/usePlannerData'
import { usePlannerStore } from '../../store/plannerStore'
import { NodeEditor } from '../shared/NodeEditor'

function Branch({ parentId = 'root', depth = 0, treeNodes, expanded, toggle, onEdit, onDelete, onDropNode }) {
  const nodes = treeNodes[parentId] ?? []

  return (
    <ul className="space-y-2">
      {nodes.map((node) => {
        const hasChildren = (treeNodes[node.id] ?? []).length > 0
        const isExpanded = expanded[node.id] ?? true

        return (
          <li key={node.id}>
            <div
              className="flex items-center gap-2 rounded border border-slate-200 bg-white p-2"
              style={{ marginLeft: depth * 16 }}
              draggable
              onDragStart={(event) => event.dataTransfer.setData('text/node-id', node.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                const draggedNodeId = event.dataTransfer.getData('text/node-id')
                onDropNode(draggedNodeId, node.id)
              }}
            >
              {hasChildren && (
                <button type="button" onClick={() => toggle(node.id)} className="rounded border px-2 text-xs">
                  {isExpanded ? '-' : '+'}
                </button>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{node.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {node.status} · {node.priority}
                </p>
              </div>
              <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => onEdit(node)}>
                Edit
              </button>
              <button
                type="button"
                className="rounded border border-red-200 px-2 py-1 text-xs text-red-600"
                onClick={() => onDelete(node.id)}
              >
                Delete
              </button>
            </div>
            {hasChildren && isExpanded && (
              <Branch
                parentId={node.id}
                depth={depth + 1}
                treeNodes={treeNodes}
                expanded={expanded}
                toggle={toggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onDropNode={onDropNode}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function FeatureTree() {
  const { treeNodes } = usePlannerData()
  const moveNode = usePlannerStore((state) => state.moveNode)
  const deleteNode = usePlannerStore((state) => state.deleteNode)
  const [expanded, setExpanded] = useState({})
  const [editorNode, setEditorNode] = useState(undefined)

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }))

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Feature Tree</h2>
        <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={() => setEditorNode(null)}>
          Add node
        </button>
      </div>
      <Branch
        treeNodes={treeNodes}
        expanded={expanded}
        toggle={toggle}
        onEdit={(node) => setEditorNode(node)}
        onDelete={deleteNode}
        onDropNode={moveNode}
      />
      {editorNode !== undefined && <NodeEditor node={editorNode} onClose={() => setEditorNode(undefined)} />}
    </section>
  )
}
