import { Router } from 'express';
import * as sudokuGameController from '@/controllers/sudokuGameController';
import { authenticateToken } from '@/middleware/authMiddleware';
import { validateJsonHeader } from '@/middleware/headerCheckMiddleware';

const router = Router();

router.get('/', authenticateToken, sudokuGameController.getSudokuGame);
router.post('/', authenticateToken, validateJsonHeader, sudokuGameController.createSudokuGame);
router.patch('/', authenticateToken, validateJsonHeader, sudokuGameController.updateSudokuGame);

export default router;
