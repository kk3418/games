import { Router } from 'express';
import * as authController from '@/controllers/authController';
import { authenticateToken, authenticateWithTokenRefresh } from '@/middleware/authMiddleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/oauth', authController.googleLogin);
router.get('/me', authenticateWithTokenRefresh, authController.getMe);
router.delete('/account', authenticateToken, authController.deleteAccount);

export default router;
