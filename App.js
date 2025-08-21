import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  StatusBar,
  Dimensions,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import Header from './components/Header';
import ItemList from './components/ItemList';
import FloatingAddButton from './components/FloatingAddButton';
import ItemModal from './components/ItemModal';
import ItemDetails from './components/ItemDetails';
import { COLORS } from './constants/colors';
import { calculateDistance } from './utils/distance';
import { NotificationManager } from './utils/notifications';
import { useFonts } from '@expo-google-fonts/fredoka/useFonts';
import { Fredoka_300Light } from '@expo-google-fonts/fredoka/300Light';
import { Fredoka_400Regular } from '@expo-google-fonts/fredoka/400Regular';
import { Fredoka_500Medium } from '@expo-google-fonts/fredoka/500Medium';
import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka/600SemiBold';
import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';

const { width, height } = Dimensions.get('window');

const BugoApp = () => {
  const [items, setItems] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const watchId = useRef(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  
  // Track which items have been notified to prevent spam
  const [notifiedItems, setNotifiedItems] = useState(new Set());

  //Load Fonts
  let [fontsLoaded] = useFonts({
    Fredoka_300Light, 
    Fredoka_400Regular, 
    Fredoka_500Medium, 
    Fredoka_600SemiBold, 
    Fredoka_700Bold
  });

  // Request location permissions
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  // Initialize notifications
  const initializeNotifications = async () => {
    try {
      const hasPermission = await NotificationManager.requestPermissions();
      setNotificationsEnabled(hasPermission);
      
      if (hasPermission) {
        console.log('Notifications enabled');
        
        // Listen for notifications while app is running
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
          console.log('Notification received:', notification);
        });

        // Handle notification responses (when user taps notification)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
          console.log('Notification response:', response);
          const { data } = response.notification.request.content;
          
          // Handle different notification types
          if (data.type === 'item_away' || data.type === 'multiple_items_away') {
            // Could open item details or show main screen
            console.log('User tapped away notification');
          } else if (data.type === 'item_returned') {
            console.log('User tapped return notification');
          }
        });
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  // Initialize location tracking
  const initializeLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Location permission is required to use this app.');
      return;
    }

    setIsLocationEnabled(true);
    
    try {
      // Get initial position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setCurrentLocation(newLocation);
      
      // Check alerts for initial position
      checkProximityAlerts(newLocation);
      
      // Watch position changes
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 10000, // Check every 10 seconds
          distanceInterval: 10, // Update when moved 10 meters
        },
        async (location) => {
          const newLoc = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          console.log('Location updated:', newLoc);
          setCurrentLocation(newLoc);
          await checkProximityAlerts(newLoc);
        }
      );
      
      watchId.current = subscription;
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Unable to get your location.');
    }
  };

  // Enhanced proximity alerts with notifications
  const checkProximityAlerts = async (currentLoc) => {
    if (!currentLoc || items.length === 0) return;

    console.log('Checking proximity for', items.length, 'items');

    const itemsToAlert = [];
    const itemsToReturn = [];

    for (const item of items) {
      if (!item.alertDistance || !item.location) {
        console.log(`Skipping item ${item.name} - missing alertDistance or location`);
        continue;
      }

      const distance = calculateDistance(
        currentLoc.latitude,
        currentLoc.longitude,
        item.location.latitude,
        item.location.longitude
      );

      console.log(`Item: ${item.name}, Distance: ${Math.round(distance)}m, Threshold: ${item.alertDistance}m, IsAway: ${item.isAway}`);

      // Check if item moved beyond threshold and hasn't been notified
      if (distance > item.alertDistance && !item.isAway && !notifiedItems.has(item.id)) {
        console.log(`🚨 Adding ${item.name} to alert list`);
        itemsToAlert.push({
          ...item,
          currentDistance: distance
        });
      } 
      // Check if item returned within threshold
      else if (distance <= item.alertDistance && item.isAway) {
        console.log(`✅ User returned within range for ${item.name}`);
        itemsToReturn.push(item);
      }
    }

    // Handle away notifications
    if (itemsToAlert.length > 0) {
      // Update notified items tracker
      const newNotifiedItems = new Set(notifiedItems);
      itemsToAlert.forEach(item => newNotifiedItems.add(item.id));
      setNotifiedItems(newNotifiedItems);

      if (notificationsEnabled) {
        // Send push notification with vibration and sound
        if (itemsToAlert.length === 1) {
          const item = itemsToAlert[0];
          await NotificationManager.scheduleItemAwayNotification(item, item.currentDistance);
          NotificationManager.triggerVibration('away');
        } else {
          await NotificationManager.scheduleMultipleItemsNotification(itemsToAlert);
          NotificationManager.triggerVibration('multiple');
        }
      } else {
        // Fallback to in-app alert if notifications disabled
        let alertTitle, alertMessage;
        
        if (itemsToAlert.length === 1) {
          const item = itemsToAlert[0];
          alertTitle = '⚠️ Don\'t Forget!';
          alertMessage = `You're ${Math.round(item.currentDistance)}m away from your ${item.name}!`;
        } else {
          alertTitle = `⚠️ Don't Forget ${itemsToAlert.length} Items!`;
          alertMessage = itemsToAlert
            .map(item => `• ${item.name} (${Math.round(item.currentDistance)}m away)`)
            .join('\n');
        }

        Alert.alert(alertTitle, alertMessage, [{ text: 'OK', style: 'default' }]);
        NotificationManager.triggerVibration('away');
      }

      // Update away status for alerted items
      const updatedItems = items.map(item => {
        const alertedItem = itemsToAlert.find(alertItem => alertItem.id === item.id);
        return alertedItem ? { ...item, isAway: true } : item;
      });
      setItems(updatedItems);
      await saveItems(updatedItems);
    }

    // Handle return notifications
    if (itemsToReturn.length > 0) {
      // Remove from notified items when they return
      const newNotifiedItems = new Set(notifiedItems);
      itemsToReturn.forEach(item => newNotifiedItems.delete(item.id));
      setNotifiedItems(newNotifiedItems);

      if (notificationsEnabled) {
        // Send return notifications (optional - might be too much)
        for (const item of itemsToReturn) {
          await NotificationManager.scheduleItemReturnedNotification(item);
        }
        NotificationManager.triggerVibration('returned');
      }

      // Update return status
      const updatedItems = items.map(item => {
        const returnedItem = itemsToReturn.find(returnItem => returnItem.id === item.id);
        return returnedItem ? { ...item, isAway: false } : item;
      });
      setItems(updatedItems);
      await saveItems(updatedItems);
    }
  };

  // Load items from storage
  const loadItems = async () => {
    try {
      const savedItems = await AsyncStorage.getItem('dontForgetItems');
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  // Save items to storage
  const saveItems = async (newItems) => {
    try {
      await AsyncStorage.setItem('dontForgetItems', JSON.stringify(newItems));
    } catch (error) {
      console.error('Error saving items:', error);
    }
  };

  // Add or update item
  const saveItem = async (itemData) => {
    if (!currentLocation) {
      Alert.alert('Error', 'Location not available. Please wait or check permissions.');
      return;
    }

    let updatedItems;
    
    if (editingItem) {
      // Update existing item and reset notification tracking
      updatedItems = items.map(item =>
        item.id === editingItem.id
          ? { ...item, ...itemData, isAway: false }
          : item
      );
      
      // Reset notification for edited item
      const newNotifiedItems = new Set(notifiedItems);
      newNotifiedItems.delete(editingItem.id);
      setNotifiedItems(newNotifiedItems);
    } else {
      // Add new item
      const newItem = {
        id: Date.now().toString(),
        ...itemData,
        location: currentLocation,
        createdAt: new Date().toISOString(),
        isAway: false,
      };
      updatedItems = [...items, newItem];
    }

    setItems(updatedItems);
    await saveItems(updatedItems);
    await checkProximityAlerts(currentLocation);
    
    setShowItemModal(false);
    setEditingItem(null);
  };

  // Delete item
  const deleteItem = async (itemId) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);
    await saveItems(updatedItems);
    
    // Remove from notification tracking
    const newNotifiedItems = new Set(notifiedItems);
    newNotifiedItems.delete(itemId);
    setNotifiedItems(newNotifiedItems);
  };

  // Edit item
  const editItem = (item) => {
    setEditingItem(item);
    setShowItemModal(true);
  };

  // Show item details
  const showItemDetailsModal = (item) => {
    setSelectedItem(item);
    setShowItemDetails(true);
  };

  // Open add modal
  const openAddModal = () => {
    setEditingItem(null);
    setShowItemModal(true);
  };

  // Handle app state changes
  const handleAppStateChange = (nextAppState) => {
    console.log('App state changed:', appState, '->', nextAppState);
    setAppState(nextAppState);
    
    // Clear notifications when app becomes active
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground');
      // Optional: Clear all notifications when app opens
      // NotificationManager.cancelAllNotifications();
    }
  };

  useEffect(() => {
    loadItems();
    initializeLocation();
    initializeNotifications();

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      // Cleanup
      if (watchId.current) {
        watchId.current.remove();
      }
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      subscription?.remove();
    };
  }, []);

  // Check proximity whenever items or location changes
  useEffect(() => {
    if (currentLocation && items.length > 0) {
      console.log('Items or location changed, checking proximity...');
      checkProximityAlerts(currentLocation);
    }
  }, [items, currentLocation]);

  if(!fontsLoaded)
    return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1a1a1a', '#1a1a1a', '#2d2d2d']}
        style={styles.backgroundGradient}
      />
      
      {/* Bokeh Background Elements */}
      <View style={styles.bokehContainer}>
        <View style={[styles.bokehCircle, styles.bokeh1]} />
        <View style={[styles.bokehCircle, styles.bokeh2]} />
        <View style={[styles.bokehCircle, styles.bokeh3]} />
      </View>

      <Header 
        isLocationEnabled={isLocationEnabled}
        itemCount={items.length}
        items={items}
        notificationsEnabled={notificationsEnabled}
      />

      <ItemList
        items={items}
        onItemPress={showItemDetailsModal}
        currentLocation={currentLocation}
      />

      <FloatingAddButton 
        onPress={openAddModal}
        disabled={!currentLocation}
      />

      <ItemModal
        visible={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setEditingItem(null);
        }}
        onSave={saveItem}
        editingItem={editingItem}
      />

      <ItemDetails
        visible={showItemDetails}
        onClose={() => {
          setShowItemDetails(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        currentLocation={currentLocation}
        onEdit={editItem}
        onDelete={deleteItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
  },
  bokehContainer: {
    position: 'absolute',
    width: width,
    height: height,
  },
  bokehCircle: {
    position: 'absolute',
    borderRadius: 200,
    opacity: 0.3,
  },
  bokeh1: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.accent,
    top: height * 0.1,
    right: -60,
    opacity: .7
  },
  bokeh2: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.accent,
    top: height * 0.3,
    left: -40,
  },
  bokeh3: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.accent,
    top: height * 0.34,
    right: width * 0.05,
  },
});

export default BugoApp;