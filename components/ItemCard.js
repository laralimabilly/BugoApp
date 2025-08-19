import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { getIconName } from '../constants/icons';

const ItemCard = ({ item, onPress, currentLocation }) => {
  // Calculate distance to item
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

  const getDistanceText = () => {
    if (!currentLocation || !item.location) return 'Location unavailable';
    
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      item.location.latitude,
      item.location.longitude
    );

    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  return (
    <TouchableOpacity style={styles.itemCard} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={['rgba(104, 247, 11, 0.1)', 'rgba(104, 247, 11, 0.05)']}
        style={styles.itemGradient}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemIconContainer}>
            <Ionicons 
              name={getIconName(item.icon)} 
              size={24} 
              color={COLORS.accent} 
            />
          </View>
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
            <Text style={styles.distanceText}>{getDistanceText()}</Text>
            <Text style={styles.distanceTextSub}>away</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
    alignItems: 'center',
  },
  itemIconContainer: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(104, 247, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  itemStatus: {
    alignItems: 'flex-end',
  },
  awayIndicator: {
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.accent,
  },
  distanceTextSub: {
    fontSize: 14,
    fontWeight: 400,
    color: COLORS.text
  }
});

export default ItemCard;