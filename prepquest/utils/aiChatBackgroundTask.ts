import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';

import { strings } from '@/constants/strings';
import { transcribeAudio } from '@/utils/aiChat/transcription';
import { arePushNotificationsEnabled } from '@/db/users';

const AI_CHAT_BG_TASK_PROGRESS_KEY = 'aiChatBgTaskProgress';

type AIChatProgress = Record<string, unknown> & {
  status: string;
  inProgress: boolean;
  completed: boolean;
  flashcardId?: number;
  deckId?: string;
};

const formatTemplate = (template: string, variables: Record<string, string | number | undefined>) =>
  template.replace(/\{(\w+)\}/g, (_match, key: string) =>
    variables[key] !== undefined ? String(variables[key]) : ''
  );

async function saveAIChatProgress(progress: Partial<AIChatProgress>) {
  try {
    const current = await AsyncStorage.getItem(AI_CHAT_BG_TASK_PROGRESS_KEY);
    const merged = {
      ...(current ? JSON.parse(current) : {}),
      ...progress,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(AI_CHAT_BG_TASK_PROGRESS_KEY, JSON.stringify(merged));
  } catch (error) {
    console.error('Failed to save AI chat progress', error);
  }
}

async function loadAIChatProgress(): Promise<AIChatProgress | null> {
  try {
    const data = await AsyncStorage.getItem(AI_CHAT_BG_TASK_PROGRESS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load AI chat progress', error);
    return null;
  }
}

async function clearAIChatProgress() {
  try {
    await AsyncStorage.removeItem(AI_CHAT_BG_TASK_PROGRESS_KEY);
  } catch (error) {
    console.error('Failed to clear AI chat progress', error);
  }
}

async function shouldSendPushNotification(): Promise<boolean> {
  const currentAppState = AppState.currentState;
  const isAppInBackground = currentAppState === 'background' || currentAppState === 'inactive';

  if (!(isAppInBackground || currentAppState === 'unknown')) {
    return false;
  }

  try {
    const enabled = await arePushNotificationsEnabled();
    if (!enabled) {
      console.log('Push notifications disabled by user preference; skipping AI chat notification');
    }
    return enabled;
  } catch (error) {
    console.error('Error checking push notification preference for AI chat task:', error);
    return false;
  }
}

const aiChatBackgroundTask = async (taskDataArguments: any) => {
  const {
    audioUri,
    voiceLanguage,
    questionContext,
    deckId,
    deckName,
    isAIDeck,
    flashcardId,
    flashcardIndex,
    totalCardCount,
    isStudyMode,
    isQuizMode,
    retryDifficult,
    language,
  } = taskDataArguments;

  const localeStrings = strings[language] ?? strings.English;
  const englishAIChatNotifications = strings.English.notifications.aiChat;
  const aiChatNotifications = localeStrings.notifications?.aiChat ?? englishAIChatNotifications;
  const {
    taskInProgressMessage = englishAIChatNotifications.taskInProgressMessage,
    completedTitle = englishAIChatNotifications.completedTitle,
    completedBody = englishAIChatNotifications.completedBody,
    networkErrorTitle = englishAIChatNotifications.networkErrorTitle,
    networkErrorBody = englishAIChatNotifications.networkErrorBody,
    serverErrorTitle = englishAIChatNotifications.serverErrorTitle,
    serverErrorBody = englishAIChatNotifications.serverErrorBody,
    statusLabel = englishAIChatNotifications.statusLabel,
  } = aiChatNotifications;

  const baseProgress = {
    deckId,
    deckName,
    isAIDeck,
    flashcardId,
    flashcardIndex,
    totalCardCount,
    isStudyMode,
    isQuizMode,
    retryDifficult,
  };

  try {
    if (!BackgroundService.isRunning()) {
      console.log('Background service stopped before AI chat could start');
      return;
    }

    await saveAIChatProgress({
      ...baseProgress,
      status: 'aiChatStarted',
      inProgress: true,
      completed: false,
      message: taskInProgressMessage,
    });

    const result = await transcribeAudio(audioUri, voiceLanguage, questionContext);

    if (!BackgroundService.isRunning()) {
      console.log('Background service stopped during AI chat processing');
      await saveAIChatProgress({
        ...baseProgress,
        status: 'cancelled',
        inProgress: false,
        completed: false,
        cancelled: true,
      });
      return;
    }

    await saveAIChatProgress({
      ...baseProgress,
      status: 'completed',
      inProgress: false,
      completed: true,
      success: true,
      transcript: result.transcript,
      aiEvaluationConcise: result.evaluation?.concise ?? null,
      aiEvaluationDetailed: result.evaluation?.detailed ?? null,
    });

    if (await shouldSendPushNotification()) {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'granted') {
          const formattedIndex = (flashcardIndex ?? 0) + 1;
          const title = formatTemplate(completedTitle, {
            flashcardIndex: formattedIndex,
          });
          const body = formatTemplate(completedBody, {
            flashcardIndex: formattedIndex,
          });

          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: {
                type: 'ai_chat_completed',
                deckId,
                deckName,
                isAIDeck,
                flashcardId,
                flashcardIndex,
                totalCardCount,
                isStudyMode,
                isQuizMode,
                retryDifficult,
              },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              autoDismiss: false,
            },
            trigger: null,
          });

          await saveAIChatProgress({
            notificationSent: true,
          });
        } else {
          console.log('Notification permissions not granted for AI chat completion');
        }
      } catch (notificationError) {
        console.error('Error sending AI chat completion notification:', notificationError);
      }
    }
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : (localeStrings.unknownError ?? strings.English.unknownError);
    const isNetworkError = error instanceof Error && error.message === 'NETWORK_ERROR';
    const isServerError =
      error instanceof Error && error.message.startsWith('SERVER_ERROR');

    if (isNetworkError) {
      await saveAIChatProgress({
        ...baseProgress,
        status: 'networkError',
        inProgress: false,
        completed: false,
        error: true,
        networkError: true,
        errorMessage: errorMessage,
      });

      if (await shouldSendPushNotification()) {
        try {
          const { status } = await Notifications.getPermissionsAsync();
          if (status === 'granted') {
            const formattedIndex = (flashcardIndex ?? 0) + 1;
            const title = formatTemplate(networkErrorTitle, {
              flashcardIndex: formattedIndex,
            });
            const body = formatTemplate(networkErrorBody, {
              flashcardIndex: formattedIndex,
            });

            await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: {
                  type: 'ai_chat_network_error',
                  deckId,
                  deckName,
                  isAIDeck,
                  flashcardId,
                  flashcardIndex,
                  totalCardCount,
                  isStudyMode,
                  isQuizMode,
                  retryDifficult,
                },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                autoDismiss: false,
              },
              trigger: null,
            });
          }
        } catch (notificationError) {
          console.error('Error sending AI chat network error notification:', notificationError);
        }
      }

      return;
    }

    let serverStatusCode: number | null = null;
    if (isServerError) {
      const match = errorMessage.match(/SERVER_ERROR:(\d+)/);
      if (match && match[1]) {
        serverStatusCode = Number(match[1]);
      }
    }

    await saveAIChatProgress({
      ...baseProgress,
      status: 'serverError',
      inProgress: false,
      completed: false,
      error: true,
      serverError: true,
      serverStatusCode,
      errorMessage,
    });

    if (await shouldSendPushNotification()) {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'granted') {
          const formattedIndex = (flashcardIndex ?? 0) + 1;
          const statusSuffix =
            typeof serverStatusCode === 'number' && Number.isFinite(serverStatusCode)
              ? ` (${statusLabel} ${serverStatusCode})`
              : '';
          const title = formatTemplate(serverErrorTitle, {
            flashcardIndex: formattedIndex,
          });
          const body = formatTemplate(serverErrorBody, {
            flashcardIndex: formattedIndex,
            statusSuffix,
          });

          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: {
                type: 'ai_chat_server_error',
                deckId,
                deckName,
                isAIDeck,
                flashcardId,
                flashcardIndex,
                totalCardCount,
                isStudyMode,
                isQuizMode,
                retryDifficult,
                serverStatusCode,
              },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              autoDismiss: false,
            },
            trigger: null,
          });
        }
      } catch (notificationError) {
        console.error('Error sending AI chat server error notification:', notificationError);
      }
    }
  }
};

interface StartAIChatParams {
  audioUri: string;
  voiceLanguage: string;
  questionContext?: string;
  deckId: string;
  deckName: string;
  isAIDeck: string;
  flashcardId: number;
  flashcardIndex: number;
  totalCardCount: number;
  isStudyMode: boolean;
  isQuizMode: boolean;
  retryDifficult: boolean;
  language: string;
}

export const startAIChatBackgroundTask = async (params: StartAIChatParams) => {
  try {
    if (BackgroundService.isRunning()) {
      console.log('Background service already running, cannot start AI chat task');
      return false;
    }

    await clearAIChatProgress();
    await new Promise(resolve => setTimeout(resolve, 50));

    const localeStrings = strings[params.language] ?? strings.English;
    const englishAIChatNotifications = strings.English.notifications.aiChat;
    const aiChatNotifications = localeStrings.notifications?.aiChat ?? englishAIChatNotifications;

    await BackgroundService.start(aiChatBackgroundTask, {
      taskName: 'AIChatEvaluation',
      taskTitle: aiChatNotifications.taskTitle,
      taskDesc: aiChatNotifications.taskDesc,
      taskIcon: { name: 'ic_launcher', type: 'mipmap' },
      color: '#44B88A',
      parameters: params,
    });

    return true;
  } catch (error) {
    console.error('Failed to start AI chat background task:', error);
    return false;
  }
};

export const stopAIChatBackgroundTask = async () => {
  try {
    if (BackgroundService.isRunning()) {
      await BackgroundService.stop();
    }
    await clearAIChatProgress();
  } catch (error) {
    console.error('Error stopping AI chat background task:', error);
  }
};

export { saveAIChatProgress, loadAIChatProgress, clearAIChatProgress };

