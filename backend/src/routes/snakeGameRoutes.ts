import { Router } from 'express';
import * as snakeGameController from '@/controllers/snakeGameController';
import { authenticateToken } from '@/middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, snakeGameController.getSnakeGameScore);
router.post('/', authenticateToken, snakeGameController.createSnakeGameScore);
router.patch('/', authenticateToken, snakeGameController.updateSnakeGameScore);

export default router;
