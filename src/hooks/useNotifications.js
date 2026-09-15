import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { NotificationManager } from '../utils/notifications';

/**
 * Requests notification permissions and wires up the app-wide notification
 * listeners. Returns whether notifications are enabled.
 *
 * @param {object} [options]
 * @param {(data: object) => void} [options.onResponse] - Called with the
 *   notification's data payload when the user taps a notification.
 */
export const useNotifications = ({ onResponse } = {}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const receivedListener = useRef(null);
  const responseListener = useRef(null);

  // Keep the latest callback without re-running the mount effect.
  const onResponseRef = useRef(onResponse);
  useEffect(() => {
    onResponseRef.current = onResponse;
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const hasPermission = await NotificationManager.requestPermissions();
        if (!mounted) return;
        setNotificationsEnabled(hasPermission);

        if (hasPermission) {
          console.log('Notifications enabled');

          receivedListener.current = Notifications.addNotificationReceivedListener(
            (notification) => {
              console.log('Notification received:', notification);
            }
          );

          responseListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
              console.log('Notification response:', response);
              onResponseRef.current?.(response.notification.request.content.data);
            }
          );
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    })();

    return () => {
      mounted = false;
      receivedListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { notificationsEnabled };
};
