import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

import Header from './components/Header';
import ItemList from './components/ItemList';
import FloatingAddButton from './components/FloatingAddButton';
import ItemModal from './components/ItemModal';
import ItemDetails from './components/ItemDetails';
import { COLORS } from './constants/colors';

const { width, height } = Dimensions.get('window');

const BugoApp = () => {
  const [items, setItems] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const watchId = useRef(null);

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
      
      // Watch position changes with more frequent updates
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
      
      // Store subscription for cleanup
      watchId.current = subscription;
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Unable to get your location.');
    }
  };

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Check proximity alerts
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

      // Collect items that need alerts (moved beyond threshold and weren't already away)
      if (distance > item.alertDistance && !item.isAway) {
        console.log(`🚨 Adding ${item.name} to alert list - distance ${Math.round(distance)}m > threshold ${item.alertDistance}m`);
        itemsToAlert.push({
          ...item,
          currentDistance: Math.round(distance)
        });
      } 
      // Collect items that returned within threshold
      else if (distance <= item.alertDistance && item.isAway) {
        console.log(`✅ User returned within range for ${item.name}`);
        itemsToReturn.push(item);
      }
    }

    // Show single alert for all items that are now beyond threshold
    if (itemsToAlert.length > 0) {
      let alertTitle, alertMessage;
      
      if (itemsToAlert.length === 1) {
        const item = itemsToAlert[0];
        alertTitle = '⚠️ Don\'t Forget!';
        alertMessage = `You're ${item.currentDistance}m away from your ${item.name}!`;
      } else {
        alertTitle = `⚠️ Don't Forget ${itemsToAlert.length} Items!`;
        alertMessage = itemsToAlert
          .map(item => `• ${item.name} (${item.currentDistance}m away)`)
          .join('\n');
      }

      Alert.alert(alertTitle, alertMessage, [{ text: 'OK', style: 'default' }]);

      // Update away status for all alerted items
      for (const item of itemsToAlert) {
        await updateItemAwayStatus(item.id, true);
      }
    }

    // Update return status for items that came back within range
    for (const item of itemsToReturn) {
      await updateItemAwayStatus(item.id, false);
    }
  };

  // Update item away status
  const updateItemAwayStatus = async (itemId, isAway) => {
    const updatedItems = items.map(item => 
      item.id === itemId ? { ...item, isAway } : item
    );
    setItems(updatedItems);
    await saveItems(updatedItems); // Persist the away status
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

  // Add or update item - FIXED VERSION
  const saveItem = async (itemData) => {
    if (!currentLocation) {
      Alert.alert('Error', 'Location not available. Please wait or check permissions.');
      return;
    }

    let updatedItems;
    
    if (editingItem) {
      // Update existing item
      updatedItems = items.map(item =>
        item.id === editingItem.id
          ? { ...item, ...itemData }
          : item
      );
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
    
    // Immediately recalculate proximity for all items after saving
    // This ensures the header updates with correct away status
    await checkProximityAlerts(currentLocation);
    
    setShowItemModal(false);
    setEditingItem(null);
  };

  // Delete item
  const deleteItem = (itemId) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);
    saveItems(updatedItems);
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

  useEffect(() => {
    loadItems();
    initializeLocation();

    return () => {
      // Cleanup location watcher
      if (watchId.current) {
        watchId.current.remove();
      }
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
        colors={['#2d2d2d', '#1a1a1a', '#2d2d2d']}
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
    opacity: 0.1,
  },
  bokeh1: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.accent,
    top: height * 0.1,
    right: -60,
  },
  bokeh2: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.accent,
    top: height * 0.6,
    left: -40,
  },
  bokeh3: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.accent,
    bottom: height * 0.2,
    right: width * 0.3,
  },
});

export default BugoApp;