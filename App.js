import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#2d2d2d',
  accent: '#68f70b',
  glass: 'rgba(45, 45, 45, 0.8)',
  glassBorder: 'rgba(104, 247, 11, 0.3)',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  warning: '#ff6b6b',
  success: '#51cf66',
};

const DontForgetApp = () => {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDistance, setNewItemDistance] = useState('50');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
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
      
      // Watch position changes
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 30000,
          distanceInterval: 5,
        },
        (location) => {
          const newLoc = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setCurrentLocation(newLoc);
          checkProximityAlerts(newLoc);
        }
      );
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
  const checkProximityAlerts = (currentLoc) => {
    if (!currentLoc) return;

    items.forEach((item) => {
      if (!item.alertDistance || !item.location) return;

      const distance = calculateDistance(
        currentLoc.latitude,
        currentLoc.longitude,
        item.location.latitude,
        item.location.longitude
      );

      if (distance > item.alertDistance && !item.isAway) {
        Alert.alert(
          '⚠️ Don\'t Forget!',
          `You're ${Math.round(distance)}m away from your ${item.name}!`,
          [{ text: 'OK', style: 'default' }]
        );
        updateItemAwayStatus(item.id, true);
      } else if (distance <= item.alertDistance && item.isAway) {
        updateItemAwayStatus(item.id, false);
      }
    });
  };

  // Update item away status
  const updateItemAwayStatus = (itemId, isAway) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, isAway } : item
      )
    );
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

  // Add new item
  const addItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name.');
      return;
    }

    if (!currentLocation) {
      Alert.alert('Error', 'Location not available. Please wait or check permissions.');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      location: currentLocation,
      alertDistance: parseInt(newItemDistance) || 50,
      createdAt: new Date().toISOString(),
      isAway: false,
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    saveItems(updatedItems);
    setNewItemName('');
    setNewItemDistance('50');
  };

  // Delete item
  const deleteItem = (itemId) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedItems = items.filter(item => item.id !== itemId);
            setItems(updatedItems);
            saveItems(updatedItems);
          },
        },
      ]
    );
  };

  // Update alert distance
  const updateAlertDistance = (itemId, newDistance) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, alertDistance: parseInt(newDistance) || 50 } : item
    );
    setItems(updatedItems);
    saveItems(updatedItems);
  };

  useEffect(() => {
    loadItems();
    initializeLocation();

    return () => {
      // Cleanup if needed
    };
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <LinearGradient
        colors={['rgba(104, 247, 11, 0.1)', 'rgba(104, 247, 11, 0.05)']}
        style={styles.itemGradient}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDetails}>
              Alert at {item.alertDistance}m • {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.itemStatus}>
            {item.isAway && (
              <View style={styles.awayIndicator}>
                <Ionicons name="warning" size={16} color={COLORS.warning} />
              </View>
            )}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteItem(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.warning} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.distanceControl}>
          <Text style={styles.distanceLabel}>Alert Distance:</Text>
          <View style={styles.distanceButtons}>
            {[25, 50, 100, 200].map((distance) => (
              <TouchableOpacity
                key={distance}
                style={[
                  styles.distanceButton,
                  item.alertDistance === distance && styles.distanceButtonActive
                ]}
                onPress={() => updateAlertDistance(item.id, distance)}
              >
                <Text style={[
                  styles.distanceButtonText,
                  item.alertDistance === distance && styles.distanceButtonTextActive
                ]}>
                  {distance}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );

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

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Don't Forget</Text>
        <Text style={styles.headerSubtitle}>
          {isLocationEnabled ? `${items.length} items tracked` : 'Location disabled'}
        </Text>
      </View>

      {/* Add Item Form */}
      <View style={styles.addForm}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="What don't you want to forget?"
            placeholderTextColor={COLORS.textSecondary}
            value={newItemName}
            onChangeText={setNewItemName}
          />
        </View>
        
        <View style={styles.distanceInputContainer}>
          <Text style={styles.inputLabel}>Alert Distance (meters):</Text>
          <TextInput
            style={styles.distanceInput}
            placeholder="50"
            placeholderTextColor={COLORS.textSecondary}
            value={newItemDistance}
            onChangeText={setNewItemDistance}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity 
          style={styles.addButton} 
          onPress={addItem}
          disabled={!currentLocation}
        >
          <LinearGradient
            colors={currentLocation ? [COLORS.accent, '#4dd100'] : ['#666', '#444']}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
            <Text style={styles.addButtonText}>Add Item</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No items added yet</Text>
            <Text style={styles.emptySubtext}>Add your first item to start tracking</Text>
          </View>
        }
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  addForm: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  inputContainer: {
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 16,
    backdropFilter: 'blur(10px)',
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  distanceInputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  distanceInput: {
    backgroundColor: COLORS.glass,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  addButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  itemCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  itemGradient: {
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 20,
    padding: 20,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  itemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  awayIndicator: {
    marginRight: 12,
  },
  deleteButton: {
    padding: 8,
  },
  distanceControl: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  distanceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  distanceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distanceButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  distanceButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  distanceButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  distanceButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    color: COLORS.textSecondary,
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
    opacity: 0.7,
  },
});

export default DontForgetApp;