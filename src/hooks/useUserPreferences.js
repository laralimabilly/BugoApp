import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'userPreferences';
const DEFAULT_PREFERENCES = {
  returnNotificationsEnabled: true,
};

/**
 * Loads and persists user preferences from AsyncStorage.
 * Returns the current preferences, a loading flag, and an updater that merges
 * a patch into the stored preferences.
 */
export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted && saved) {
          setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const updatePreferences = useCallback((patch) => {
    setPreferences((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error) =>
        console.error('Error saving user preferences:', error)
      );
      return next;
    });
  }, []);

  return { preferences, loading, updatePreferences };
};
