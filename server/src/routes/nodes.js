import { Router } from 'express'
import {
  createNode,
  deleteNode,
  listNodes,
  updateNode,
} from '../controllers/nodesController.js'

const router = Router()

router.get('/', listNodes)
router.post('/', createNode)
router.put('/:id', updateNode)
router.delete('/:id', deleteNode)

export default router
