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
import { calculateDistance } from './utils/distance';

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
      const updatedItems = items.map(item => {
        const alertedItem = itemsToAlert.find(alertItem => alertItem.id === item.id);
        if (alertedItem) {
          return { ...item, isAway: true };
        }
        return item;
      });
      setItems(updatedItems);
      await saveItems(updatedItems);
    }

    // Update return status for items that came back within range
    if (itemsToReturn.length > 0) {
      const updatedItems = items.map(item => {
        const returnedItem = itemsToReturn.find(returnItem => returnItem.id === item.id);
        if (returnedItem) {
          return { ...item, isAway: false };
        }
        return item;
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
      // Validate items before saving
      const validItems = newItems.filter(item => 
        item.id && item.name && item.location && typeof item.alertDistance === 'number'
      );
      
      if (validItems.length !== newItems.length) {
        console.warn('Some items were invalid and filtered out during save');
      }
      
      await AsyncStorage.setItem('dontForgetItems', JSON.stringify(validItems));
      console.log(`Saved ${validItems.length} items to storage`);
    } catch (error) {
      console.error('Error saving items:', error);
      throw error; // Re-throw to handle in calling function
    }
  };

  // Add or update item
  const saveItem = async (itemData) => {
    if (!currentLocation) {
      Alert.alert('Error', 'Location not available. Please wait or check permissions.');
      return;
    }
  
    try {
      let updatedItems;
      
      if (editingItem) {
        // Update existing item - preserve original location and createdAt
        updatedItems = items.map(item =>
          item.id === editingItem.id
            ? { 
                ...item, 
                ...itemData,
                // Preserve these fields from original item
                location: item.location,
                createdAt: item.createdAt,
                // Reset away status when item is edited (user might have changed alert distance)
                isAway: false
              }
            : item
        );
        
        console.log(`Updated item: ${editingItem.id}`, updatedItems.find(i => i.id === editingItem.id));
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
        
        console.log('Added new item:', newItem);
      }
  
      // Update state first
      setItems(updatedItems);
      
      // Save to storage
      await saveItems(updatedItems);
      
      // Force immediate proximity check with updated items
      setTimeout(() => {
        checkProximityAlerts(currentLocation, updatedItems);
      }, 100);
      
      // Close modal and reset editing state
      setShowItemModal(false);
      setEditingItem(null);
      
      console.log('Item save completed successfully');
      
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'Failed to save item. Please try again.');
    }
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