import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { notificationService } from '../services/notifications';

type NotificationSubscription = ReturnType<typeof Notifications.addNotificationReceivedListener>;

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<NotificationSubscription | null>(null);
  const responseListener = useRef<NotificationSubscription | null>(null);

  useEffect(() => {
    // Register for push notifications
    notificationService.registerForPushNotifications().then((token) => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    // Listen for incoming notifications
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      },
    );

    // Listen for notification interactions
    responseListener.current = notificationService.addNotificationResponseListener(
      (response) => {
        const data = response.notification.request.content.data;

        // Navigate based on notification type
        switch (data?.type) {
          case 'poi_validated':
            router.push('/my-pois');
            break;
          case 'level_up':
          case 'reward':
            router.push('/rewards');
            break;
          default:
            break;
        }
      },
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    notifyPOIValidated: notificationService.notifyPOIValidated.bind(notificationService),
    notifyLevelUp: notificationService.notifyLevelUp.bind(notificationService),
    notifyRewardEarned: notificationService.notifyRewardEarned.bind(notificationService),
  };
}

export default useNotifications;
