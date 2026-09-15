import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'dontForgetItems';

/**
 * Owns the tracked items: loading, persistence, CRUD, and away/return status.
 *
 * Notification de-duplication (which items have already fired an "away" alert)
 * is kept in a ref rather than state — it gates alerts but should not trigger
 * re-renders.
 */
export const useItems = () => {
  const [items, setItems] = useState([]);
  const notifiedItemsRef = useRef(new Set());

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setItems(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading items:', error);
      }
    })();
  }, []);

  // Update state and persist in one step, always deriving from the latest state.
  const commit = useCallback((updater) => {
    setItems((prev) => {
      const next = updater(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error) =>
        console.error('Error saving items:', error)
      );
      return next;
    });
  }, []);

  const saveItem = useCallback(
    (itemData, { editingItem, location }) => {
      if (editingItem) {
        // Editing resets away/notification state so alerts re-arm.
        notifiedItemsRef.current.delete(editingItem.id);
        commit((prev) =>
          prev.map((item) =>
            item.id === editingItem.id
              ? { ...item, ...itemData, isAway: false }
              : item
          )
        );
      } else {
        const newItem = {
          id: Date.now().toString(),
          ...itemData,
          location,
          createdAt: new Date().toISOString(),
          isAway: false,
        };
        commit((prev) => [...prev, newItem]);
      }
    },
    [commit]
  );

  const deleteItem = useCallback(
    (itemId) => {
      notifiedItemsRef.current.delete(itemId);
      commit((prev) => prev.filter((item) => item.id !== itemId));
    },
    [commit]
  );

  const setItemsAway = useCallback(
    (itemIds) => {
      const ids = new Set(itemIds);
      itemIds.forEach((id) => notifiedItemsRef.current.add(id));
      commit((prev) =>
        prev.map((item) => (ids.has(item.id) ? { ...item, isAway: true } : item))
      );
    },
    [commit]
  );

  const setItemsReturned = useCallback(
    (itemIds) => {
      const ids = new Set(itemIds);
      itemIds.forEach((id) => notifiedItemsRef.current.delete(id));
      commit((prev) =>
        prev.map((item) => (ids.has(item.id) ? { ...item, isAway: false } : item))
      );
    },
    [commit]
  );

  return {
    items,
    notifiedItemsRef,
    saveItem,
    deleteItem,
    setItemsAway,
    setItemsReturned,
  };
};
