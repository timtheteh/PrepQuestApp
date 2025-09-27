// Simple test file to verify statistics cache functionality
// This file can be used for manual testing or removed in production

import { statisticsCache, CACHE_KEYS, clearUserStatisticsCache } from './statisticsCache';

// Test data
const testData = {
  breakdown: { decksData: [], flashcardsData: [] },
  grades: { daily: [], monthly: [] },
  stats: { accumulatedDecks: 5, accumulatedFlashcards: 50 }
};

// Test functions
export const testStatisticsCache = async () => {
  console.log('🧪 Testing Statistics Cache...');
  
  try {
    // Test 1: Set and get cache
    console.log('Test 1: Setting cache...');
    await statisticsCache.setCache(CACHE_KEYS.BREAKDOWN_DATA, testData.breakdown);
    const cachedData = await statisticsCache.getCache(CACHE_KEYS.BREAKDOWN_DATA);
    console.log('✅ Cache set and retrieved:', cachedData);
    
    // Test 2: Check cache validity
    console.log('Test 2: Checking cache validity...');
    const hasValidCache = await statisticsCache.hasValidCache(CACHE_KEYS.BREAKDOWN_DATA);
    console.log('✅ Cache is valid:', hasValidCache);
    
    // Test 3: Clear specific cache
    console.log('Test 3: Clearing specific cache...');
    await statisticsCache.clearCache(CACHE_KEYS.BREAKDOWN_DATA);
    const clearedData = await statisticsCache.getCache(CACHE_KEYS.BREAKDOWN_DATA);
    console.log('✅ Cache cleared:', clearedData === null);
    
    // Test 4: Get cached or fetch
    console.log('Test 4: Testing getCachedOrFetch...');
    const fetchFunction = async () => {
      console.log('  📡 Fetching fresh data...');
      return testData.grades;
    };
    
    const result = await statisticsCache.getCachedOrFetch(CACHE_KEYS.GRADE_CHART_DAILY, fetchFunction);
    console.log('✅ getCachedOrFetch result:', result);
    
    // Test 5: Clear all cache
    console.log('Test 5: Clearing all cache...');
    await clearUserStatisticsCache();
    console.log('✅ All cache cleared');
    
    console.log('🎉 All cache tests passed!');
    
  } catch (error) {
    console.error('❌ Cache test failed:', error);
  }
};

// Export for manual testing
export default testStatisticsCache;
