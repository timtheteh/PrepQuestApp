import { getAnimationConfig } from './animationConfig';

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
