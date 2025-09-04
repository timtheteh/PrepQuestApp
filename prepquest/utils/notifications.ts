import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { strings } from '../constants/strings';

export interface NotificationData extends Record<string, unknown> {
  type: 'deck_created' | 'flashcards_created' | 'deck_and_flashcards_created' | 'backup_completed' | 'clear_data_completed';
  deckId?: number;
  deckName?: string;
  flashcardCount?: number;
  folderName?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return; // Already initialized
    }

    try {
      // Configure notification behavior (only once)
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return;
      }

      // Get push token
      if (Device.isDevice) {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
        });
        this.expoPushToken = token.data;
        console.log('Expo push token:', this.expoPushToken);
      }

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#44B88A',
        });
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  async sendLocalNotification(
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<void> {
    try {
      // Use immediate notification with null trigger
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true, // Ensure sound plays
          priority: Notifications.AndroidNotificationPriority.HIGH, // High priority for important notifications
        },
        trigger: null, // Send immediately
      });
      
      console.log('Local notification scheduled successfully:', { title, body, data });
    } catch (error) {
      console.error('Error sending local notification:', error);
      
      // Fallback: try using presentNotificationAsync for immediate display
      try {
        await Notifications.presentNotificationAsync({
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        });
        console.log('Fallback notification sent using presentNotificationAsync');
      } catch (fallbackError) {
        console.error('Fallback notification also failed:', fallbackError);
      }
    }
  }

  async sendDeckCreatedNotification(
    deckName: string,
    deckId: number,
    language: string
  ): Promise<void> {
    const title = language === 'Chinese' 
      ? '卡组创建成功！' 
      : 'Deck Created Successfully!';
    
    const body = language === 'Chinese'
      ? `您的卡组"${deckName}"已准备就绪，可以开始学习了！`
      : `Your deck "${deckName}" is ready for study!`;

    await this.sendLocalNotification(title, body, {
      type: 'deck_created',
      deckId,
      deckName,
    });
  }

  async sendFlashcardsCreatedNotification(
    flashcardCount: number,
    deckName: string,
    deckId: number,
    language: string
  ): Promise<void> {
    const title = language === 'Chinese'
      ? '闪卡创建成功！'
      : 'Flashcards Created Successfully!';
    
    const body = language === 'Chinese'
      ? `已为"${deckName}"创建了${flashcardCount}张闪卡`
      : `${flashcardCount} flashcards have been created for "${deckName}"`;

    await this.sendLocalNotification(title, body, {
      type: 'flashcards_created',
      deckId,
      deckName,
      flashcardCount,
    });
  }

  async sendDeckAndFlashcardsCreatedNotification(
    deckName: string,
    deckId: number,
    flashcardCount: number,
    language: string
  ): Promise<void> {
    const title = language === 'Chinese'
      ? '卡组和闪卡创建成功！'
      : 'Deck and Flashcards Created Successfully!';
    
    const body = language === 'Chinese'
      ? `您的卡组"${deckName}"和${flashcardCount}张闪卡已准备就绪`
      : `Your deck "${deckName}" with ${flashcardCount} flashcards is ready!`;

    await this.sendLocalNotification(title, body, {
      type: 'deck_and_flashcards_created',
      deckId,
      deckName,
      flashcardCount,
    });
  }

  async sendFolderDeckCreatedNotification(
    deckName: string,
    deckId: number,
    folderName: string,
    language: string
  ): Promise<void> {
    const title = language === 'Chinese'
      ? '文件夹卡组创建成功！'
      : 'Folder Deck Created Successfully!';
    
    const body = language === 'Chinese'
      ? `卡组"${deckName}"已添加到文件夹"${folderName}"`
      : `Deck "${deckName}" has been added to folder "${folderName}"`;

    await this.sendLocalNotification(title, body, {
      type: 'deck_created',
      deckId,
      deckName,
      folderName,
    });
  }

  async sendBackupCompletedNotification(
    language: string
  ): Promise<void> {
    const title = language === 'Chinese'
      ? '备份完成！'
      : 'Backup Completed!';
    
    const body = language === 'Chinese'
      ? '您的数据已成功备份到云端'
      : 'Your data has been successfully backed up to the cloud';

    await this.sendLocalNotification(title, body, {
      type: 'backup_completed',
    });
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  // Test function to verify notifications work
  async sendTestNotification(language: string): Promise<void> {
    const title = language === 'Chinese' ? '测试通知' : 'Test Notification';
    const body = language === 'Chinese' ? '通知系统工作正常！' : 'Notification system is working!';
    
    await this.sendLocalNotification(title, body, {
      type: 'deck_created',
      deckId: 0,
      deckName: 'Test Deck',
    });
  }
}

export default NotificationService; 