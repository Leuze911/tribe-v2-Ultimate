import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: 'poi_validated' | 'level_up' | 'reward' | 'system';
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

class NotificationService {
  private pushToken: string | null = null;

  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.pushToken = token.data;

      // Register token with backend
      await this.registerTokenWithBackend(token.data);

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
        });
      }

      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      await api.post('/users/push-token', { token });
    } catch (error) {
      console.error('Failed to register push token with backend:', error);
    }
  }

  async scheduleLocalNotification(notification: NotificationData): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: { type: notification.type, ...notification.data },
        sound: 'default',
      },
      trigger: null, // Immediate notification
    });
  }

  async scheduleDailyReminder(): Promise<void> {
    // Schedule a daily reminder at 10:00 AM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🗺️ Découvrez de nouveaux lieux !',
        body: 'N\'oubliez pas d\'explorer votre quartier et d\'ajouter des POI.',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: 10,
        minute: 0,
        repeats: true,
      },
    });
  }

  async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void,
  ) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void,
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  // Notification templates
  async notifyPOIValidated(poiName: string): Promise<void> {
    await this.scheduleLocalNotification({
      type: 'poi_validated',
      title: '✅ POI Validé !',
      body: `Votre POI "${poiName}" a été validé. +10 points !`,
    });
  }

  async notifyLevelUp(newLevel: number): Promise<void> {
    await this.scheduleLocalNotification({
      type: 'level_up',
      title: '🎉 Niveau supérieur !',
      body: `Félicitations ! Vous êtes maintenant niveau ${newLevel} !`,
    });
  }

  async notifyRewardEarned(rewardName: string): Promise<void> {
    await this.scheduleLocalNotification({
      type: 'reward',
      title: '🏆 Nouvelle récompense !',
      body: `Vous avez débloqué : ${rewardName}`,
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
