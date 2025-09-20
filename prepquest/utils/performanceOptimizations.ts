import { getAnimationConfig } from './animationConfig';

// Global cache for screen data to prevent unnecessary database queries
const screenDataCache = new Map<string, {
  data: any;
  timestamp: number;
  expiryTime: number;
}>();

// Cache duration: 2 minutes for low-end devices, 5 minutes for others
const getCacheDuration = () => {
  const config = getAnimationConfig();
  return config.isLowEndDevice ? 120000 : 300000; // Longer cache for better performance
};

/**
 * Optimized data loader with caching for screen navigation performance
 */
export const optimizedDataLoader = {
  /**
   * Load data with caching support
   */
  async loadWithCache<T>(
    cacheKey: string,
    dataLoader: () => Promise<T>,
    forceRefresh: boolean = false
  ): Promise<T> {
    const now = Date.now();
    const cacheDuration = getCacheDuration();
    
    // Check if we have valid cached data and don't need to force refresh
    if (!forceRefresh && screenDataCache.has(cacheKey)) {
      const cached = screenDataCache.get(cacheKey)!;
      if (now < cached.expiryTime) {
        return cached.data;
      }
    }
    
    // Load fresh data
    const data = await dataLoader();
    
    // Cache the result
    screenDataCache.set(cacheKey, {
      data,
      timestamp: now,
      expiryTime: now + cacheDuration,
    });
    
    return data;
  },

  /**
   * Load multiple data sources in parallel (for high-end devices) or sequentially (for low-end)
   */
  async loadMultipleData<T>(
    loaders: Array<() => Promise<T>>
  ): Promise<T[]> {
    const config = getAnimationConfig();
    
    if (config.enableParallelDataLoading) {
      // Parallel loading for high-end devices
      return Promise.all(loaders.map(loader => loader()));
    } else {
      // Sequential loading for low-end devices to prevent overwhelming
      const results: T[] = [];
      for (const loader of loaders) {
        results.push(await loader());
      }
      return results;
    }
  },

  /**
   * Optimized image loading with batching
   */
  async loadImages(
    imageLoaders: Array<() => Promise<any>>,
    batchSize: number = 5
  ): Promise<any[]> {
    const config = getAnimationConfig();
    
    if (!config.enableImagePreloading) {
      // For low-end devices, load images in smaller batches
      const results: any[] = [];
      const lowEndBatchSize = Math.min(batchSize, 2);
      
      for (let i = 0; i < imageLoaders.length; i += lowEndBatchSize) {
        const batch = imageLoaders.slice(i, i + lowEndBatchSize);
        const batchResults = await Promise.all(batch.map(loader => loader()));
        results.push(...batchResults);
        
        // Small delay between batches for low-end devices
        if (i + lowEndBatchSize < imageLoaders.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      return results;
    } else {
      // For high-end devices, load all images in parallel
      return Promise.all(imageLoaders.map(loader => loader()));
    }
  },

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of screenDataCache.entries()) {
      if (now >= cached.expiryTime) {
        screenDataCache.delete(key);
      }
    }
  },

  /**
   * Clear all cache (useful for forced refreshes)
   */
  clearAllCache(): void {
    screenDataCache.clear();
  },

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    return {
      totalEntries: screenDataCache.size,
      entries: Array.from(screenDataCache.entries()).map(([key, value]) => ({
        key,
        timestamp: value.timestamp,
        expiryTime: value.expiryTime,
        isExpired: Date.now() >= value.expiryTime,
      })),
    };
  },

  /**
   * Universal screen data loader with aggressive caching for all screens
   */
  async loadScreenData<T>(
    screenName: string,
    dataLoaders: Record<string, () => Promise<any>>,
    forceRefresh: boolean = false
  ): Promise<Record<string, any>> {
    const config = getAnimationConfig();
    const results: Record<string, any> = {};
    
    if (config.isLowEndDevice) {
      // Sequential loading for low-end devices with individual caching
      for (const [key, loader] of Object.entries(dataLoaders)) {
        const cacheKey = `${screenName}-${key}`;
        results[key] = await this.loadWithCache(cacheKey, loader, forceRefresh);
      }
    } else {
      // Parallel loading for high-end devices
      const promises = Object.entries(dataLoaders).map(async ([key, loader]) => {
        const cacheKey = `${screenName}-${key}`;
        return [key, await this.loadWithCache(cacheKey, loader, forceRefresh)];
      });
      
      const resolvedResults = await Promise.all(promises);
      for (const [key, data] of resolvedResults) {
        results[key] = data;
      }
    }
    
    return results;
  },
};

/**
 * Performance-optimized screen transition helper
 */
export const optimizedScreenTransition = {
  /**
   * Get optimized screen transition duration based on device performance
   */
  getTransitionDuration(): number {
    const config = getAnimationConfig();
    return config.screenTransitionDuration;
  },

  /**
   * Perform optimized screen transition with data preloading
   */
  async transitionWithDataPreload<T>(
    animationCallback: () => void,
    dataLoader: () => Promise<T>
  ): Promise<T> {
    const config = getAnimationConfig();
    
    if (config.isLowEndDevice) {
      // For low-end devices: Start animation first, then load data
      animationCallback();
      return await dataLoader();
    } else {
      // For high-end devices: Load data in parallel with animation
      const [data] = await Promise.all([
        dataLoader(),
        new Promise<void>(resolve => {
          animationCallback();
          setTimeout(resolve, config.screenTransitionDuration);
        }),
      ]);
      return data;
    }
  },
};

/**
 * Debounced function helper for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttled function helper for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
