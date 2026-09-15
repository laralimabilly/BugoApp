import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Text from './CustomText';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/colors';

const NavBar = ({ activeScreen, onScreenChange }) => {
  const NavButton = ({ screen, icon, isActive, onPress }) => {
    const textColor = isActive ? COLORS.accent : COLORS.text;

    return(
        <TouchableOpacity
        style={styles.navButton}
        onPress={onPress}
        activeOpacity={0.8}
        >
            {/* {isActive && (
                <LinearGradient
                colors={['rgba(104, 247, 11, 0.2)', 'rgba(104, 247, 11, 0.1)']}
                style={styles.activeBackground}
                />
            )} */}
            <View style={[
                styles.iconContainer,
                isActive && styles.iconContainerActive
            ]}>
                <Ionicons
                name={icon}
                size={24}
                color={textColor}
                />
                <Text style={styles.navText} color={textColor}>{screen}</Text>
            </View>
        </TouchableOpacity>
    );
  }

  return (
    <View style={styles.navbar}>
      <BlurView intensity={20} style={styles.blurBackground} />
      <LinearGradient
        colors={['rgba(45, 45, 45, 0)', 'rgba(45, 45, 45, 0)']}
        style={styles.navbarGradient}
      >
        <View style={styles.navContent}>
          <NavButton
            screen="home"
            icon="home"
            isActive={activeScreen === 'home'}
            onPress={() => onScreenChange('home')}
          />
          <NavButton
            screen="settings"
            icon="settings"
            isActive={activeScreen === 'settings'}
            onPress={() => onScreenChange('settings')}
          />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    paddingBottom: 0,
    paddingTop: 0,
    overflow: 'hidden',
    zIndex: 100,
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  navbarGradient: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  navContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 20,
    backgroundColor: 'transparent'
  },
  navButton: {
    position: 'relative',
    width: 60,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 10,
    marginTop: 5,
  },
  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(104, 247, 11, 0.3)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconContainerActive: {
    // backgroundColor: 'rgba(104, 247, 11, 0.1)',
  },
});

export default NavBar;