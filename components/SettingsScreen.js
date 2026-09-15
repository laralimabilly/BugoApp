import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Text from './CustomText';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/typography';

const { width, height } = Dimensions.get('window');

const SettingsScreen = () => {
  const [returnNotificationsEnabled, setReturnNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from storage
  const loadPreferences = async () => {
    try {
      const savedPrefs = await AsyncStorage.getItem('userPreferences');
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        setReturnNotificationsEnabled(prefs.returnNotificationsEnabled ?? true);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save preferences to storage
  const savePreferences = async (newPrefs) => {
    try {
      const currentPrefs = await AsyncStorage.getItem('userPreferences');
      const prefs = currentPrefs ? JSON.parse(currentPrefs) : {};
      
      const updatedPrefs = { ...prefs, ...newPrefs };
      await AsyncStorage.setItem('userPreferences', JSON.stringify(updatedPrefs));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const handleReturnNotificationsToggle = async (value) => {
    setReturnNotificationsEnabled(value);
    await savePreferences({ returnNotificationsEnabled: value });
  };

  const openPrivacyPolicy = () => {
    // Replace with your actual privacy policy URL
    const privacyUrl = 'https://yourcompany.com/privacy-policy';
    Linking.openURL(privacyUrl).catch(() => {
      Alert.alert('Error', 'Unable to open privacy policy. Please try again later.');
    });
  };

  const openWebsite = () => {
    // Replace with your actual website URL
    const websiteUrl = 'https://yourcompany.com';
    Linking.openURL(websiteUrl).catch(() => {
      Alert.alert('Error', 'Unable to open website. Please try again later.');
    });
  };

  const SettingsCard = ({ children, style }) => (
    <View style={[styles.settingsCard, style]}>
      <LinearGradient
        colors={['rgba(104, 247, 11, 0.1)', 'rgba(104, 247, 11, 0.05)']}
        style={styles.settingsCardGradient}
      >
        {children}
      </LinearGradient>
    </View>
  );

  const SettingsRow = ({ icon, title, subtitle, rightComponent, onPress, showArrow = false }) => (
    <TouchableOpacity 
      style={styles.settingsRow} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingsRowLeft}>
        <View style={styles.settingsIcon}>
          <Ionicons name={icon} size={20} color={COLORS.accent} />
        </View>
        <View style={styles.settingsContent}>
          <Text style={styles.settingsTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.settingsSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.settingsRowRight}>
        {rightComponent}
        {showArrow && (
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={COLORS.textSecondary} 
            style={styles.arrowIcon}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#1a1a1a', '#1a1a1a', '#2d2d2d']}
          style={styles.backgroundGradient}
        />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} /> */}
      
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

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#2d2d2d', 'transparent']}
          style={styles.headerGradient}
        />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your experience</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <SettingsCard>
            <SettingsRow
              icon="notifications-outline"
              title="Return Notifications"
              subtitle="Get notified when you return within range of your items"
              rightComponent={
                <Switch
                  value={returnNotificationsEnabled}
                  onValueChange={handleReturnNotificationsToggle}
                  trackColor={{ 
                    false: 'rgba(255, 255, 255, 0.2)', 
                    true: 'rgba(104, 247, 11, 0.3)' 
                  }}
                  thumbColor={returnNotificationsEnabled ? COLORS.accent : '#f4f3f4'}
                  ios_backgroundColor="rgba(255, 255, 255, 0.2)"
                />
              }
            />
          </SettingsCard>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Info</Text>
          <SettingsCard>
            <SettingsRow
              icon="information-circle-outline"
              title="App Version"
              subtitle="1.0.0"
              rightComponent={null}
            />
            <View style={styles.separator} />
            <SettingsRow
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              subtitle="Learn how we protect your data"
              onPress={openPrivacyPolicy}
              showArrow={true}
            />
            <View style={styles.separator} />
            <SettingsRow
              icon="globe-outline"
              title="Website"
              subtitle="Visit our website for more information"
              onPress={openWebsite}
              showArrow={true}
            />
          </SettingsCard>
        </View>

        {/* Additional spacing for navbar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
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
    opacity: 0.7,
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(45, 45, 45, 0.7)',
    zIndex: 1,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    zIndex: 1,
  },
  headerContent: {
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
    fontFamily: FONTS.semiBold,
  },
  settingsCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  settingsCardGradient: {
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 20,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(104, 247, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
    fontFamily: FONTS.semiBold,
  },
  settingsSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  arrowIcon: {
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
  },
  bottomSpacing: {
    height: 120, // Space for navbar
  },
});

export default SettingsScreen;