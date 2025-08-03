import { useEffect, useRef } from 'react';
import { useBackgroundTask } from '@/contexts/BackgroundTaskContext';

interface UseBackgroundTaskRefreshOptions {
  onTaskComplete?: () => void;
  onTaskStart?: () => void;
  refreshOnComplete?: boolean;
}

export const useBackgroundTaskRefresh = (options: UseBackgroundTaskRefreshOptions = {}) => {
  const { isBackgroundTaskRunning, backgroundTaskProgress } = useBackgroundTask();
  const lastTaskState = useRef<{
    wasRunning: boolean;
    wasCompleted: boolean;
    lastStatus: string | undefined;
  }>({
    wasRunning: false,
    wasCompleted: false,
    lastStatus: undefined,
  });

  useEffect(() => {
    const currentTaskRunning = isBackgroundTaskRunning;
    const currentTaskCompleted = backgroundTaskProgress?.completed === true;
    
    console.log('BackgroundTaskRefresh - State change:', {
      currentTaskRunning,
      currentTaskCompleted,
      wasRunning: lastTaskState.current.wasRunning,
      wasCompleted: lastTaskState.current.wasCompleted,
      hasProgress: !!backgroundTaskProgress
    });
    
    // Check if task just started
    if (currentTaskRunning && !lastTaskState.current.wasRunning) {
      console.log('Background task started - triggering onTaskStart');
      if (options.onTaskStart) {
        options.onTaskStart();
      }
    }
    
    // Check if task just completed - simplified logic
    if (currentTaskCompleted && !lastTaskState.current.wasCompleted) {
      console.log('Background task completed - triggering refresh');
      if (options.onTaskComplete) {
        options.onTaskComplete();
      }
    }
    
    // Also trigger refresh when status changes to deckAndFlashcardsCreated
    const currentStatus = backgroundTaskProgress?.status;
    const lastStatus = lastTaskState.current.lastStatus;
    if (currentStatus === 'deckAndFlashcardsCreated' && lastStatus !== 'deckAndFlashcardsCreated') {
      console.log('Background task deck and flashcards created - triggering refresh');
      if (options.onTaskComplete) {
        options.onTaskComplete();
      }
    }
    
    // Also trigger refresh when background service stops but we have flashcards generated
    if (currentStatus === 'flashcardsGenerated' && lastStatus === 'flashcardsGenerated' && !currentTaskRunning) {
      console.log('Background service stopped with flashcards generated - triggering refresh');
      if (options.onTaskComplete) {
        options.onTaskComplete();
      }
    }
    
    // Update last state
    lastTaskState.current = {
      wasRunning: currentTaskRunning,
      wasCompleted: currentTaskCompleted,
      lastStatus: currentStatus,
    };
  }, [isBackgroundTaskRunning, backgroundTaskProgress?.completed, options.onTaskComplete, options.onTaskStart]);

  return {
    isBackgroundTaskRunning,
    backgroundTaskProgress,
    shouldRefresh: !isBackgroundTaskRunning && backgroundTaskProgress?.completed === true,
  };
}; 