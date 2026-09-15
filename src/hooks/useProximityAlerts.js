import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { calculateDistance } from '../utils/distance';
import { NotificationManager } from '../utils/notifications';

/**
 * Owns location tracking and proximity detection. On every position update (and
 * whenever items change) it checks each item against its alert distance, fires
 * away/return notifications (or an in-app fallback), and reports which items
 * changed state via the provided callbacks.
 *
 * @param {object} params
 * @param {Array} params.items - Tracked items.
 * @param {React.MutableRefObject<Set>} params.notifiedItemsRef - De-dup set of already-alerted item ids.
 * @param {boolean} params.notificationsEnabled - Whether push notifications are allowed.
 * @param {boolean} params.returnNotificationsEnabled - Whether "returned" notifications are wanted.
 * @param {(ids: string[]) => void} params.onItemsAway - Called with ids that moved out of range.
 * @param {(ids: string[]) => void} params.onItemsReturned - Called with ids that came back in range.
 * @returns {{ currentLocation: object|null, isLocationEnabled: boolean }}
 */
export const useProximityAlerts = ({
  items,
  notifiedItemsRef,
  notificationsEnabled,
  returnNotificationsEnabled,
  onItemsAway,
  onItemsReturned,
}) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const watchRef = useRef(null);

  // Re-created every render so it always closes over the latest props; the
  // mount-registered location watcher reaches it through checkRef to avoid
  // running against a stale closure.
  const checkProximity = async (currentLoc) => {
    if (!currentLoc || items.length === 0) return;

    const itemsToAlert = [];
    const itemsToReturn = [];

    for (const item of items) {
      if (!item.alertDistance || !item.location) continue;

      const distance = calculateDistance(
        currentLoc.latitude,
        currentLoc.longitude,
        item.location.latitude,
        item.location.longitude
      );

      if (
        distance > item.alertDistance &&
        !item.isAway &&
        !notifiedItemsRef.current.has(item.id)
      ) {
        itemsToAlert.push({ ...item, currentDistance: distance });
      } else if (distance <= item.alertDistance && item.isAway) {
        itemsToReturn.push(item);
      }
    }

    if (itemsToAlert.length > 0) {
      if (notificationsEnabled) {
        if (itemsToAlert.length === 1) {
          const item = itemsToAlert[0];
          await NotificationManager.scheduleItemAwayNotification(item, item.currentDistance);
          NotificationManager.triggerVibration('away');
        } else {
          await NotificationManager.scheduleMultipleItemsNotification(itemsToAlert);
          NotificationManager.triggerVibration('multiple');
        }
      } else {
        // Fallback to an in-app alert when notifications are disabled.
        let alertTitle;
        let alertMessage;
        if (itemsToAlert.length === 1) {
          const item = itemsToAlert[0];
          alertTitle = "⚠️ Don't Forget!";
          alertMessage = `You're ${Math.round(item.currentDistance)}m away from your ${item.name}!`;
        } else {
          alertTitle = `⚠️ Don't Forget ${itemsToAlert.length} Items!`;
          alertMessage = itemsToAlert
            .map((item) => `• ${item.name} (${Math.round(item.currentDistance)}m away)`)
            .join('\n');
        }
        Alert.alert(alertTitle, alertMessage, [{ text: 'OK', style: 'default' }]);
        NotificationManager.triggerVibration('away');
      }

      onItemsAway(itemsToAlert.map((item) => item.id));
    }

    if (itemsToReturn.length > 0) {
      if (notificationsEnabled && returnNotificationsEnabled) {
        for (const item of itemsToReturn) {
          await NotificationManager.scheduleItemReturnedNotification(item);
        }
        NotificationManager.triggerVibration('returned');
      }

      onItemsReturned(itemsToReturn.map((item) => item.id));
    }
  };

  const checkRef = useRef(checkProximity);
  useEffect(() => {
    checkRef.current = checkProximity;
  });

  // Request permission and start watching once, on mount.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      let granted = false;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        granted = status === 'granted';
      } catch (error) {
        console.error('Permission error:', error);
      }

      if (!granted) {
        Alert.alert('Permission Required', 'Location permission is required to use this app.');
        return;
      }
      if (cancelled) return;

      setIsLocationEnabled(true);

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        const initial = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        if (cancelled) return;

        setCurrentLocation(initial);
        checkRef.current(initial);

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 10000, // Check every 10 seconds
            distanceInterval: 10, // Update when moved 10 meters
          },
          (update) => {
            const newLoc = {
              latitude: update.coords.latitude,
              longitude: update.coords.longitude,
            };
            console.log('Location updated:', newLoc);
            setCurrentLocation(newLoc);
            checkRef.current(newLoc);
          }
        );

        if (cancelled) {
          subscription.remove();
          return;
        }
        watchRef.current = subscription;
      } catch (error) {
        console.error('Location error:', error);
        Alert.alert('Location Error', 'Unable to get your location.');
      }
    })();

    return () => {
      cancelled = true;
      if (watchRef.current) watchRef.current.remove();
    };
  }, []);

  // Re-check whenever items or location change.
  useEffect(() => {
    if (currentLocation && items.length > 0) {
      checkRef.current(currentLocation);
    }
  }, [items, currentLocation]);

  return { currentLocation, isLocationEnabled };
};
