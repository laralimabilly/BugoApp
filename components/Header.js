import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

const Header = ({ isLocationEnabled, itemCount, items = [] }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Calculate items that are away
  const awayItems = items.filter(item => item.isAway);
  const nearbyItems = itemCount - awayItems.length;

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

    // Pulse animation for location indicator
    if (isLocationEnabled) {
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
  }, [isLocationEnabled]);

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
        colors={['rgba(104, 247, 11, 0.1)', 'rgba(104, 247, 11, 0.05)']}
        style={styles.statusCardGradient}
      >
        <View style={styles.statusCardContent}>
          <Ionicons name={icon} size={20} color={color} />
          <View style={styles.statusCardText}>
            <Text style={[styles.statusValue, { color }]}>{value}</Text>
            <Text style={styles.statusLabel}>{label}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.header}>
      {/* Blur Background */}
      <BlurView intensity={10} style={styles.blurBackground} />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['rgba(104, 247, 11, 0.08)', 'transparent']}
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
            {isLocationEnabled && (
              <Animated.View 
                style={[
                  styles.locationIndicator,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <View style={styles.locationPulse}>
                  <Ionicons name="location" size={16} color={COLORS.accent} />
                </View>
              </Animated.View>
            )}
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
          
          {awayItems.length > 0 && (
            <StatusCard
              icon="warning-outline"
              value={awayItems.length}
              label={awayItems.length === 1 ? "item away" : "items away"}
              color={COLORS.warning}
            />
          )}
          
          <StatusCard
            icon="stats-chart-outline"
            value={itemCount}
            label="total tracked"
            color={COLORS.textSecondary}
          />
        </Animated.View>

        {/* Status Message */}
        <Animated.View 
          style={[
            styles.statusMessage,
            { opacity: fadeAnim }
          ]}
        >
          {!isLocationEnabled ? (
            <View style={styles.warningMessage}>
              <Ionicons name="location-outline" size={16} color={COLORS.warning} />
              <Text style={styles.warningText}>Location services disabled</Text>
            </View>
          ) : awayItems.length > 0 ? (
            <View style={styles.alertMessage}>
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.warning} />
              <Text style={styles.alertText}>
                {awayItems.length === 1 
                  ? `Don't forget your ${awayItems[0].name}!` 
                  : `You're away from ${awayItems.length} items`
                }
              </Text>
            </View>
          ) : itemCount > 0 ? (
            <View style={styles.successMessage}>
              <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.accent} />
              <Text style={styles.successText}>All items are nearby</Text>
            </View>
          ) : (
            <View style={styles.infoMessage}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>Tap + to add your first item</Text>
            </View>
          )}
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
    boxShadow: '5px 5px 10px rgba(0, 0, 0, 0.3)'
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
    height: 200,
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
  locationIndicator: {
    marginLeft: 16,
  },
  locationPulse: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(104, 247, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(104, 247, 11, 0.3)',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  statusCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
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