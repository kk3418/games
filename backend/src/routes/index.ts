import { Router } from 'express';
import authRoutes from './authRoutes';
import sudokuGameRoutes from './sudokuGameRoutes';
import sudokuHistoryRoutes from './sudokuHistoryRoutes';

const router = Router();

router.use('/', authRoutes);
router.use('/sudoku-game', sudokuGameRoutes);
router.use('/sudoku-history', sudokuHistoryRoutes);

export default router;
