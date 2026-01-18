import { Router } from 'express'
import * as sudokuHistoryController from '@/controllers/sudokuHistoryController'
import { authenticateToken } from '@/middleware/authMiddleware'
import { validateJsonHeader } from '@/middleware/headerCheckMiddleware'

const router = Router()

router.get('/', authenticateToken, sudokuHistoryController.getHistory)
router.post('/', authenticateToken, validateJsonHeader, sudokuHistoryController.createHistory)
router.patch('/:id', authenticateToken, validateJsonHeader, sudokuHistoryController.updateHistoryStatus)

export default router
