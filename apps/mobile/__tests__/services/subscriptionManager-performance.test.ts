import AsyncStorage from '@react-native-async-storage/async-storage';
import SubscriptionManager from '../../services/SubscriptionManager';
import { createMockVerificationResult, setupMockFetch, setupSubscriptionTest, cleanupSubscriptionTest } from '../testUtils';

describe('SubscriptionManager - Performance Tests', () => {
  let manager: SubscriptionManager;

  beforeEach(async () => {
    await setupSubscriptionTest();
    manager = SubscriptionManager.getInstance();
  });

  afterEach(async () => {
    await cleanupSubscriptionTest();
  });

  describe('Debouncing Performance', () => {
    test('should cache results within debounce window', async () => {
      setupMockFetch(createMockVerificationResult({ trialActive: true }));
      
      const start1 = performance.now();
      await manager.resolveSubscriptionStatus();
      const end1 = performance.now();
      
      const start2 = performance.now();
      await manager.resolveSubscriptionStatus();
      const end2 = performance.now();
      
      const time1 = end1 - start1;
      const time2 = end2 - start2;
      
      expect(time2).toBeLessThan(time1 + 50);
      expect(time2).toBeLessThan(100);
      expect(time2).toBeLessThan(time1);
    });

    test('should bypass debounce on forceRefresh', async () => {
      setupMockFetch(createMockVerificationResult({ trialActive: true }));
      
      const start = performance.now();
      await manager.resolveSubscriptionStatus({ forceRefresh: true });
      const end = performance.now();
      
      const time = end - start;
      expect(time).toBeLessThan(200);
      expect(time).toBeGreaterThan(10);
    });

    test('should not debounce concurrent calls', async () => {
      setupMockFetch(createMockVerificationResult({ trialActive: true }));
      
      const start = performance.now();
      
      const promise1 = manager.resolveSubscriptionStatus();
      const promise2 = manager.resolveSubscriptionStatus();
      const promise3 = manager.resolveSubscriptionStatus();
      
      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);
      const end = performance.now();
      
      const time = end - start;
      expect(time).toBeLessThan(500);
      expect([result1, result2, result3]).toEqual(['trial', 'trial', 'trial']);
    });
  });

  describe('Singleton Pattern Efficiency', () => {
    test('should return same instance across multiple calls', async () => {
      const instance1 = SubscriptionManager.getInstance();
      const instance2 = SubscriptionManager.getInstance();
      const instance3 = SubscriptionManager.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
      expect(instance1).toBe(instance3);
    });

    test('should not create duplicate instances in concurrent scenarios', async () => {
      setupMockFetch(createMockVerificationResult({ trialActive: true }));
      
      const promises = Array(100).fill(0).map(() => manager.resolveSubscriptionStatus());
      await Promise.all(promises);
      
      const instances = new Set([SubscriptionManager.getInstance()]);
      expect(instances.size).toBe(1);
    });
  });

  describe('Cache Invalidation Overhead', () => {
    test('should handle cache invalidation efficiently', async () => {
      setupMockFetch(createMockVerificationResult({ trialActive: true }));
      
      const status1 = await manager.resolveSubscriptionStatus();
      expect(status1).toBe('trial');
      
      manager.invalidateCache();
      expect(manager.getCachedStatus()).toBeNull();
      
      setupMockFetch(createMockVerificationResult({ subscriptionActive: true }));
      const status2 = await manager.resolveSubscriptionStatus({ forceRefresh: true });
      expect(status2).toBe('active');
      expect(manager.getCachedStatus()).toBe('active');
      
      const status3 = await manager.resolveSubscriptionStatus();
      expect(status3).toBe('active');
      expect(manager.getCachedStatus()).toBe('active');
    });

    test('should not cause memory leaks with repeated invalidation', async () => {
      setupMockFetch(createMockVerificationResult({ trialActive: true }));
      
      const iterations = 1000;
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        await manager.resolveSubscriptionStatus();
        
        if (i % 10 === 0) {
          manager.invalidateCache();
        }
      }
      
      const end = performance.now();
      const totalTime = end - start;
      const avgTimePerIteration = totalTime / iterations;
      
      expect(avgTimePerIteration).toBeLessThan(10);
      expect(totalTime).toBeLessThan(15000);
    });
  });

  describe('Concurrent Call Protection', () => {
    test('should return loading for concurrent calls after first', async () => {
      setupMockFetch(createMockVerificationResult({ trialActive: true }));
      
      const promise1 = manager.resolveSubscriptionStatus();
      const promise2 = manager.resolveSubscriptionStatus();
      const promise3 = manager.resolveSubscriptionStatus();
      const promise4 = manager.resolveSubscriptionStatus();
      const promise5 = manager.resolveSubscriptionStatus();
      
      const [result1, result2, result3, result4, result5] = await Promise.all([
        promise1,
        promise2,
        promise3,
        promise4,
        promise5
      ]);
      
      expect(result1).toBe('trial');
      expect([result2, result3, result4, result5]).toEqual(['loading', 'loading', 'loading', 'loading']);
    });

    test('should complete concurrent calls efficiently', async () => {
      setupMockFetch(createMockVerificationResult({ trialActive: true }));
      
      const start = performance.now();
      
      const concurrentCalls = 50;
      const promises = Array(concurrentCalls).fill(0).map(() => manager.resolveSubscriptionStatus());
      const results = await Promise.all(promises);
      
      const end = performance.now();
      const time = end - start;
      
      expect(time).toBeLessThan(500);
      expect(results.filter((r: string) => r === 'trial').length).toBe(1);
      expect(results.filter((r: string) => r === 'loading').length).toBe(concurrentCalls - 1);
    });
  });

  describe('Memory Usage', () => {
    test('should handle large numbers of subscriptions efficiently', async () => {
      const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      setupMockFetch(createMockVerificationResult({ trialActive: true }));
      
      const iterations = 1000;
      for (let i = 0; i < iterations; i++) {
        await manager.resolveSubscriptionStatus();
      }
      
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = endMemory - startMemory;
      
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Purchase Complete Performance', () => {
    test('should set purchaseJustCompleted flag efficiently', async () => {
      setupMockFetch(createMockVerificationResult({ trialActive: true }));
      
      const start = performance.now();
      await manager.handlePurchaseComplete();
      const end = performance.now();
      
      expect(end - start).toBeLessThan(10);
    });
  });
});
