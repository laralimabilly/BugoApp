// utils/notifications.js - Centralized notification system

import * as Notifications from 'expo-notifications';
import { Platform, Vibration } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationManager {
  static async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }
      
      console.log('Notification permissions granted');
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async scheduleItemAwayNotification(item, distance) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "⚠️ Don't Forget!",
          body: `You're ${Math.round(distance)}m away from your ${item.name}`,
          data: { 
            itemId: item.id,
            itemName: item.name,
            distance: Math.round(distance),
            type: 'item_away'
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 250, 250, 250], // Vibration pattern: wait, vibrate, wait, vibrate
          badge: 1,
        },
        trigger: null, // Show immediately
      });
      
      console.log(`Scheduled away notification for ${item.name}, ID: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  static async scheduleMultipleItemsNotification(awayItems) {
    try {
      const itemNames = awayItems.map(item => item.name).join(', ');
      const count = awayItems.length;
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ Don't Forget ${count} Items!`,
          body: count === 2 
            ? `You're away from ${itemNames}` 
            : `You're away from ${itemNames.split(', ').slice(0, 2).join(', ')} and ${count - 2} more`,
          data: { 
            itemIds: awayItems.map(item => item.id),
            itemCount: count,
            type: 'multiple_items_away'
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 250, 250, 250, 250, 250], // Longer vibration for multiple items
          badge: count,
        },
        trigger: null,
      });
      
      console.log(`Scheduled multiple items notification, ID: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling multiple items notification:', error);
      return null;
    }
  }

  static async scheduleItemReturnedNotification(item) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "✅ Welcome Back!",
          body: `You're back within range of your ${item.name}`,
          data: { 
            itemId: item.id,
            itemName: item.name,
            type: 'item_returned'
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          vibrate: [0, 150], // Single short vibration
          badge: 0, // Clear badge when returning
        },
        trigger: null,
      });
      
      console.log(`Scheduled return notification for ${item.name}, ID: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling return notification:', error);
      return null;
    }
  }

  static async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all notifications');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  static async cancelNotificationById(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`Cancelled notification: ${notificationId}`);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  // Enhanced vibration patterns
  static triggerVibration(pattern = 'default') {
    if (Platform.OS === 'ios') {
      // iOS vibration patterns
      switch (pattern) {
        case 'away':
          Vibration.vibrate([0, 400, 200, 400]); // Long-short-long
          break;
        case 'returned':
          Vibration.vibrate([0, 200]); // Single short
          break;
        case 'multiple':
          Vibration.vibrate([0, 400, 200, 400, 200, 400]); // Long-short-long-short-long
          break;
        default:
          Vibration.vibrate(400);
      }
    } else {
      // Android vibration patterns
      switch (pattern) {
        case 'away':
          Vibration.vibrate([0, 500, 300, 500]);
          break;
        case 'returned':
          Vibration.vibrate([0, 200]);
          break;
        case 'multiple':
          Vibration.vibrate([0, 500, 300, 500, 300, 500]);
          break;
        default:
          Vibration.vibrate(500);
      }
    }
  }

  // Check if device supports vibration
  static isVibrationSupported() {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  // Get notification settings for debugging
  static async getNotificationSettings() {
    try {
      const settings = await Notifications.getPermissionsAsync();
      console.log('Notification settings:', settings);
      return settings;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  }
}