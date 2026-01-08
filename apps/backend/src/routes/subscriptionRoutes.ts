import { Router } from 'express';
import {
    getServerTime,
    getTrialStatus,
    recordTrialStart,
    getSubscriptionStatus,
    syncSubscription,
    verifySubscription,
    verifyPurchase,
    resetSubscriptionData,
} from '../controllers/subscriptionController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// 서버 시간 조회 (인증 불필요)
router.get('/server-time', getServerTime);

// 체험 상태 조회 (인증 필요)
router.get('/trial-status/:userId', verifyToken, getTrialStatus);

// 체험 시작 기록 (인증 필요)
router.post('/trial-start', verifyToken, recordTrialStart);

// 구독 상태 조회 (인증 필요)
router.get('/status/:userId', verifyToken, getSubscriptionStatus);

// 구독 상태 동기화 (인증 필요)
router.post('/sync', verifyToken, syncSubscription);

// 구독 상태 검증 - SSOT (인증 필요)
router.post('/verify', verifyToken, verifySubscription);

// Google Play 구매 검증 (인증 필요)
router.post('/verify-purchase', verifyToken, verifyPurchase);

// 데이터 초기화 (테스트용, 인증 필요)
router.delete('/reset/:userId', verifyToken, resetSubscriptionData);

export default router;
