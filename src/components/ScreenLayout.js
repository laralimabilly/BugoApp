import React from 'react';
import { View, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import NavBar from './NavBar';
import { COLORS } from '../constants/colors';

const { width, height } = Dimensions.get('window');

/**
 * Standard shell every screen mounts into. Provides the shared background
 * (gradient + bokeh), status bar, and the global bottom NavBar so that all
 * screens have an identical mounting structure.
 *
 * Layout order matters: `children` (screen content) render first, the NavBar
 * paints over the bottom, and `overlay` renders last so floating elements
 * (e.g. the home add button) sit above the NavBar — all as siblings of one
 * parent, which is the only reliable way to control stacking in React Native.
 *
 * @param {React.ReactNode} children - Screen content.
 * @param {string} activeScreen - Currently active screen key (for the NavBar).
 * @param {(screen: string) => void} onScreenChange - NavBar navigation handler.
 * @param {React.ReactNode} [overlay] - Optional layer rendered above the NavBar.
 */
const ScreenLayout = ({ children, activeScreen, onScreenChange, overlay }) => {
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

      {/* Screen Content */}
      {children}

      {/* Global Navigation Bar */}
      <NavBar activeScreen={activeScreen} onScreenChange={onScreenChange} />

      {/* Overlay layer (rendered above the NavBar) */}
      {overlay}
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
});

export default ScreenLayout;
