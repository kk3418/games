import { Router } from 'express';
import authRoutes from './authRoutes';
import snakeGameRoutes from './snakeGameRoutes';
import sudokuGameRoutes from './sudokuGameRoutes';
import sudokuHistoryRoutes from './sudokuHistoryRoutes';

const router = Router();

router.use('/', authRoutes);
router.use('/snake-game', snakeGameRoutes);
router.use('/sudoku-game', sudokuGameRoutes);
router.use('/sudoku-history', sudokuHistoryRoutes);

export default router;
