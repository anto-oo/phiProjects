import { useMemo } from 'react'
import { usePlannerStore } from '../store/plannerStore'

export function usePlannerData() {
  const project = usePlannerStore((state) => state.getSelectedProject())
  const filteredNodes = usePlannerStore((state) => state.getFilteredNodes())

  const treeNodes = useMemo(() => {
    const byParent = filteredNodes.reduce((acc, node) => {
      const key = node.parentId ?? 'root'
      if (!acc[key]) acc[key] = []
      acc[key].push(node)
      return acc
    }, {})

    Object.values(byParent).forEach((nodes) => nodes.sort((a, b) => a.order - b.order))

    return byParent
  }, [filteredNodes])

  return {
    project,
    filteredNodes,
    treeNodes,
  }
}
