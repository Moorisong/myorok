import { Router } from 'express';
import { kakaoLogin, logout } from '../controllers/authController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// POST /auth/kakao - Kakao OAuth login
router.post('/kakao', kakaoLogin);

// POST /auth/logout - Logout (requires authentication)
router.post('/logout', verifyToken, logout);

export default router;
