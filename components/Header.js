import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import Text from './CustomText';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/typography';

const { width, height } = Dimensions.get('window');

const Header = ({ isLocationEnabled, itemCount, items = [], notificationsEnabled = false }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Memoize calculations to prevent unnecessary re-renders
  const { awayItems, nearbyItems, statusMessage } = useMemo(() => {
    const away = items.filter(item => item.isAway);
    const nearby = itemCount - away.length;
    
    let message = '';
    if (!isLocationEnabled) {
      message = 'location_disabled';
    } else if (!notificationsEnabled) {
      message = 'notifications_disabled';
    } else if (away.length > 0) {
      message = away.length === 1 
        ? `Don't forget your ${away[0].name}!`
        : `You're away from ${away.length} items`;
    } else if (itemCount > 0) {
      message = 'all_nearby';
    } else {
      message = 'no_items';
    }
    
    return { 
      awayItems: away, 
      nearbyItems: nearby, 
      statusMessage: message 
    };
  }, [items, itemCount, isLocationEnabled, notificationsEnabled]);

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for indicators
    if (isLocationEnabled || notificationsEnabled) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isLocationEnabled, notificationsEnabled]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const StatusCard = ({ icon, value, label, color = COLORS.accent, onPress }) => (
    <TouchableOpacity 
      style={styles.statusCard} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['rgba(104, 247, 11, 0.2)', 'rgba(104, 247, 11, 0.05)']}
        style={styles.statusCardGradient}
      >
        <View style={styles.statusCardContent}>
          <Ionicons name={icon} size={20} color={color} />
          <View style={styles.statusCardText}>
            <Text style={[styles.statusValue, { color }]}>{value}</Text>
            <Text style={[styles.statusLabel, {fontFamily: FONTS.regular}]}>{label}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderStatusMessage = () => {
    switch (statusMessage) {
      case 'location_disabled':
        return (
          <View style={styles.warningMessage}>
            <Ionicons name="location-outline" size={16} color={COLORS.warning} />
            <Text style={styles.warningText}>Location services disabled</Text>
          </View>
        );
      case 'notifications_disabled':
        return (
          <View style={styles.warningMessage}>
            <Ionicons name="notifications-off-outline" size={16} color={COLORS.warning} />
            <Text style={styles.warningText}>Enable notifications for alerts</Text>
          </View>
        );
      case 'all_nearby':
        return (
          <View style={styles.successMessage}>
            <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.accent} />
            <Text style={styles.successText}>All items are nearby</Text>
          </View>
        );
      case 'no_items':
        return (
          <View style={styles.infoMessage}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>Tap + to add your first item</Text>
          </View>
        );
      default:
        return (
          <View style={styles.alertMessage}>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.warning} />
            <Text style={styles.alertText}>{statusMessage}</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.header}>
      {/* Blur Background */}
      <BlurView intensity={20} style={styles.blurBackground} />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#2d2d2d', 'transparent']}
        style={styles.headerGradient}
      />
      
      {/* Main Header Content */}
      <Animated.View 
        style={[
          styles.headerContent,
          {
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          }
        ]}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Don't Forget</Text>
            <View style={styles.indicatorsContainer}>
              {/* Location Indicator */}
              {isLocationEnabled && (
                <Animated.View 
                  style={[
                    styles.indicator,
                    { transform: [{ scale: pulseAnim }] }
                  ]}
                >
                  <View style={styles.locationPulse}>
                    <Ionicons name="location" size={14} color={COLORS.accent} />
                  </View>
                </Animated.View>
              )}
              
              {/* Notification Indicator */}
              {notificationsEnabled && (
                <Animated.View 
                  style={[
                    styles.indicator,
                    { transform: [{ scale: pulseAnim }] }
                  ]}
                >
                  <View style={styles.notificationPulse}>
                    <Ionicons name="notifications" size={14} color={COLORS.accent} />
                  </View>
                </Animated.View>
              )}
            </View>
          </View>
        </View>

        {/* Status Cards */}
        <Animated.View 
          style={[
            styles.statusContainer,
            { opacity: fadeAnim }
          ]}
        >
          <StatusCard
            icon="checkmark-circle-outline"
            value={nearbyItems}
            label={nearbyItems === 1 ? "item nearby" : "items nearby"}
            color={COLORS.accent}
          />
          
          <StatusCard
            icon="stats-chart-outline"
            value={itemCount}
            label="total tracked"
            color={COLORS.textSecondary}
          />

          {awayItems.length > 0 && (
            <StatusCard
              icon="warning-outline"
              value={awayItems.length}
              label={awayItems.length === 1 ? "item away" : "items away"}
              color={COLORS.warning}
            />
          )}
        </Animated.View>

        {/* Status Message */}
        <Animated.View 
          style={[
            styles.statusMessage,
            { opacity: fadeAnim }
          ]}
        >
          {renderStatusMessage()}
        </Animated.View>
      </Animated.View>

      {/* Decorative Elements */}
      <View style={styles.decorativeElements}>
        <View style={[styles.floatingDot, styles.dot1]} />
        <View style={[styles.floatingDot, styles.dot2]} />
        <View style={[styles.floatingDot, styles.dot3]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(45, 45, 45, 0.7)',
    boxShadow: '0px 0px 4px 2px rgba(0, 0, 0, 0.3)',
    zIndex: 1
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: -24,
    right: -24,
    bottom: 0,
    zIndex: 0,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height,
    zIndex: 1,
  },
  headerContent: {
    zIndex: 2,
  },
  titleSection: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    marginLeft: 4,
  },
  locationPulse: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(104, 247, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(104, 247, 11, 0.3)',
  },
  notificationPulse: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(104, 247, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(104, 247, 11, 0.3)',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
  },
  statusCard: {
    flexBasis: '40%',
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    width: '50%'
  },
  statusCardGradient: {
    padding: 1,
    borderRadius: 16,
  },
  statusCardContent: {
    backgroundColor: COLORS.glass,
    borderRadius: 15,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  statusCardText: {
    marginLeft: 12,
    flex: 1,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statusMessage: {
    alignItems: 'center',
  },
  warningMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  warningText: {
    color: COLORS.warning,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  alertMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  alertText: {
    color: COLORS.warning,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(104, 247, 11, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(104, 247, 11, 0.2)',
  },
  successText: {
    color: COLORS.accent,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  infoMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  infoText: {
    color: COLORS.textSecondary,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  floatingDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
    opacity: 0.3,
  },
  dot1: {
    top: 80,
    right: 60,
  },
  dot2: {
    top: 120,
    right: 100,
  },
  dot3: {
    top: 140,
    right: 40,
  },
});

export default Header;