import { Router } from 'express';
import authRoutes from './authRoutes';
import sudokuGameRoutes from './sudokuGameRoutes';

const router = Router();

router.use('/', authRoutes);
router.use('/sudoku-game', sudokuGameRoutes);

export default router;
