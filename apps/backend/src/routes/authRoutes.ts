import { Router } from 'express';
import { kakaoLogin, logout, kakaoCallback } from '../controllers/authController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// GET /auth/kakao - Kakao OAuth callback (browser redirect from Kakao)
router.get('/kakao', kakaoCallback);

// POST /auth/kakao - Kakao OAuth login (API call from app)
router.post('/kakao', kakaoLogin);

// POST /auth/logout - Logout (requires authentication)
router.post('/logout', verifyToken, logout);

export default router;
