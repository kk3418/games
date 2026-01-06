import { Router } from 'express';
import * as snakeGameController from '@/controllers/snakeGameController';
import { authenticateToken } from '@/middleware/authMiddleware';
import { validateJsonHeader } from '@/middleware/headerCheckMiddleware';

const router = Router();

router.get('/', authenticateToken, snakeGameController.getSnakeGameScore);
router.post('/', authenticateToken, validateJsonHeader, snakeGameController.createSnakeGameScore);
router.patch('/', authenticateToken, validateJsonHeader, snakeGameController.updateSnakeGameScore);

export default router;
