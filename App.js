// App.js - Updated with premium features and ads
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
import AdBanner from './components/AdBanner';
import PremiumUpgradeModal from './components/PremiumUpgradeModal';
import { COLORS } from './constants/colors';
import { calculateDistance } from './utils/distance';
import { NotificationManager } from './utils/notifications';
import { PremiumManager, FREE_ITEM_LIMIT } from './utils/premium';
import { InterstitialAdManager } from './components/AdInterstitial';

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
  
  // Premium features state
  const [isPremium, setIsPremium] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [itemsAddedCount, setItemsAddedCount] = useState(0); // Track for interstitial ads
  
  const watchId = useRef(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  
  // Track which items have been notified to prevent spam
  const [notifiedItems, setNotifiedItems] = useState(new Set());

  // Initialize premium status and ads
  useEffect(() => {
    const initializePremiumAndAds = async () => {
      // Check premium status
      const premiumStatus = await PremiumManager.isPremiumUser();
      setIsPremium(premiumStatus);
      
      // Initialize ads only for free users
      if (!premiumStatus) {
        await InterstitialAdManager.initialize();
      }
    };
    
    initializePremiumAndAds();
  }, []);

  // Check if user can add more items (free version limit)
  const canAddMoreItems = () => {
    if (isPremium) return true;
    return items.length < FREE_ITEM_LIMIT;
  };

  // Show upgrade modal for item limit
  const handleItemLimitReached = () => {
    Alert.alert(
      'Upgrade to Premium',
      PremiumManager.getItemLimitMessage(items.length),
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade Now', onPress: () => setShowUpgradeModal(true) }
      ]
    );
  };

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

      if (notificationsEnabled && isPremium) { // Only send return notifications for premium users
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

  // Add or update item with premium checks
  const saveItem = async (itemData) => {
    if (!currentLocation) {
      Alert.alert('Error', 'Location not available. Please wait or check permissions.');
      return;
    }

    // Check item limit for free users
    if (!editingItem && !isPremium && !canAddMoreItems()) {
      handleItemLimitReached();
      return;
    }

    // Check custom alert distance (premium feature)
    const standardDistances = [25, 50, 100, 200];
    if (!isPremium && !standardDistances.includes(itemData.alertDistance)) {
      Alert.alert(
        'Premium Feature',
        'Custom alert distances are a premium feature. Upgrade to set any distance you want!',
        [
          { text: 'Use 50m', onPress: () => saveItemWithDistance({ ...itemData, alertDistance: 50 }) },
          { text: 'Upgrade', onPress: () => setShowUpgradeModal(true) }
        ]
      );
      return;
    }

    await saveItemWithDistance(itemData);
  };

  const saveItemWithDistance = async (itemData) => {
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
      
      // Track items added for interstitial ad timing (free users only)
      if (!isPremium) {
        const newCount = itemsAddedCount + 1;
        setItemsAddedCount(newCount);
        
        // Show interstitial ad after 3rd item
        if (newCount === 3) {
          setTimeout(() => {
            InterstitialAdManager.showAd();
          }, 1000); // Delay to let modal close first
        }
      }
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

  // Open add modal with premium checks
  const openAddModal = () => {
    if (!isPremium && !canAddMoreItems()) {
      handleItemLimitReached();
      return;
    }
    
    setEditingItem(null);
    setShowItemModal(true);
  };

  // Handle premium upgrade success
  const handleUpgradeSuccess = async () => {
    setIsPremium(true);
    // Optionally refresh the app state or show celebration
  };

  // Handle app state changes
  const handleAppStateChange = (nextAppState) => {
    console.log('App state changed:', appState, '->', nextAppState);
    setAppState(nextAppState);
    
    // Clear notifications when app becomes active
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground');
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
        isPremium={isPremium}
        onUpgradePress={() => setShowUpgradeModal(true)}
      />

      {/* Ad Banner - Only show for free users */}
      {!isPremium && (
        <AdBanner style={styles.adBanner} />
      )}

      <ItemList
        items={items}
        onItemPress={showItemDetailsModal}
        currentLocation={currentLocation}
        isPremium={isPremium}
      />

      <FloatingAddButton 
        onPress={openAddModal}
        disabled={!currentLocation}
        isPremium={isPremium}
        canAddMore={canAddMoreItems()}
      />

      <ItemModal
        visible={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setEditingItem(null);
        }}
        onSave={saveItem}
        editingItem={editingItem}
        isPremium={isPremium}
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
        isPremium={isPremium}
      />

      <PremiumUpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgradeSuccess={handleUpgradeSuccess}
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
  adBanner: {
    marginTop: -12,
    marginBottom: 12,
  },
});

export default BugoApp;