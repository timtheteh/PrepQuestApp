import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserID } from '@/db/decks';

// Cache configuration
const CACHE_EXPIRY_HOURS = 1; // Cache expires after 1 hour
const CACHE_PREFIX = 'stats_cache_';

// Cache keys for different statistics components
export const CACHE_KEYS = {
  BREAKDOWN_DATA: 'breakdown_data',
  GRADE_CHART_DAILY: 'grade_chart_daily',
  GRADE_CHART_MONTHLY: 'grade_chart_monthly',
  MORE_DETAILS_STATS: 'more_details_stats',
  REVIEW_LINE_DAILY: 'review_line_daily',
  REVIEW_LINE_MONTHLY: 'review_line_monthly',
  SPEED_CHART_DAILY: 'speed_chart_daily',
  SPEED_CHART_MONTHLY: 'speed_chart_monthly',
  AVERAGE_GRADE: 'average_grade',
  AVERAGE_TIME: 'average_time',
  DIFFICULTY_BREAKDOWN: 'difficulty_breakdown',
} as const;

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  userId: string;
}

// Cache utility class
export class StatisticsCache {
  private static instance: StatisticsCache;
  private currentUserId: string | null = null;

  private constructor() {}

  public static getInstance(): StatisticsCache {
    if (!StatisticsCache.instance) {
      StatisticsCache.instance = new StatisticsCache();
    }
    return StatisticsCache.instance;
  }

  // Initialize cache with current user ID
  private async initializeUserId(): Promise<void> {
    if (!this.currentUserId) {
      try {
        this.currentUserId = await getCurrentUserID();
      } catch (error) {
        console.error('Failed to get current user ID:', error);
        this.currentUserId = null;
      }
    }
  }

  // Get cache key with user ID
  private async getCacheKey(key: string): Promise<string> {
    await this.initializeUserId();
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }
    return `${CACHE_PREFIX}${this.currentUserId}_${key}`;
  }

  // Check if cache entry is valid (not expired)
  private isCacheValid(timestamp: number): boolean {
    const now = Date.now();
    const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000; // Convert hours to milliseconds
    return (now - timestamp) < expiryTime;
  }

  // Set cache entry
  public async setCache<T>(key: string, data: T): Promise<void> {
    try {
      const cacheKey = await this.getCacheKey(key);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        userId: this.currentUserId!,
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
      console.log(`✅ Cached ${key} for user ${this.currentUserId}`);
    } catch (error) {
      console.error(`❌ Failed to cache ${key}:`, error);
    }
  }

  // Get cache entry
  public async getCache<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = await this.getCacheKey(key);
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cachedData);
      
      // Check if cache is valid and belongs to current user
      if (!this.isCacheValid(entry.timestamp) || entry.userId !== this.currentUserId) {
        // Remove expired or invalid cache
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      console.log(`✅ Retrieved cached ${key} for user ${this.currentUserId}`);
      return entry.data;
    } catch (error) {
      console.error(`❌ Failed to get cache ${key}:`, error);
      return null;
    }
  }

  // Clear specific cache entry
  public async clearCache(key: string): Promise<void> {
    try {
      const cacheKey = await this.getCacheKey(key);
      await AsyncStorage.removeItem(cacheKey);
      console.log(`✅ Cleared cache ${key} for user ${this.currentUserId}`);
    } catch (error) {
      console.error(`❌ Failed to clear cache ${key}:`, error);
    }
  }

  // Clear all cache for current user
  public async clearAllCache(): Promise<void> {
    try {
      await this.initializeUserId();
      if (!this.currentUserId) {
        return;
      }

      const keys = await AsyncStorage.getAllKeys();
      const userCacheKeys = keys.filter(key => 
        key.startsWith(`${CACHE_PREFIX}${this.currentUserId}_`)
      );

      if (userCacheKeys.length > 0) {
        await AsyncStorage.multiRemove(userCacheKeys);
        console.log(`✅ Cleared ${userCacheKeys.length} cache entries for user ${this.currentUserId}`);
      }
    } catch (error) {
      console.error('❌ Failed to clear all cache:', error);
    }
  }

  // Check if cache exists and is valid
  public async hasValidCache(key: string): Promise<boolean> {
    try {
      const cacheKey = await this.getCacheKey(key);
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) {
        return false;
      }

      const entry: CacheEntry<any> = JSON.parse(cachedData);
      return this.isCacheValid(entry.timestamp) && entry.userId === this.currentUserId;
    } catch (error) {
      console.error(`❌ Failed to check cache validity for ${key}:`, error);
      return false;
    }
  }

  // Reset user ID (call when user logs out)
  public resetUserId(): void {
    this.currentUserId = null;
  }

  // Force refresh (clear cache and fetch fresh data)
  public async forceRefresh<T>(
    key: string, 
    fetchFunction: () => Promise<T>
  ): Promise<T> {
    await this.clearCache(key);
    const freshData = await fetchFunction();
    await this.setCache(key, freshData);
    return freshData;
  }

  // Get cached data or fetch fresh if not available
  public async getCachedOrFetch<T>(
    key: string,
    fetchFunction: () => Promise<T>
  ): Promise<T> {
    // Try to get cached data first
    const cachedData = await this.getCache<T>(key);
    
    if (cachedData !== null) {
      return cachedData;
    }

    // If no cached data, fetch fresh data and cache it
    console.log(`🔄 No cache found for ${key}, fetching fresh data...`);
    const freshData = await fetchFunction();
    await this.setCache(key, freshData);
    return freshData;
  }
}

// Export singleton instance
export const statisticsCache = StatisticsCache.getInstance();

// Utility function to clear cache when user logs out
export const clearUserStatisticsCache = async (): Promise<void> => {
  await statisticsCache.clearAllCache();
  statisticsCache.resetUserId();
};

// Utility function to force refresh all statistics
export const refreshAllStatistics = async (): Promise<void> => {
  await statisticsCache.clearAllCache();
};
