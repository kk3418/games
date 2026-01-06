import { Router } from 'express';
import authRoutes from './authRoutes';
import snakeGameRoutes from './snakeGameRoutes';

const router = Router();

router.use('/', authRoutes);
router.use('/snake-game', snakeGameRoutes);

export default router;
