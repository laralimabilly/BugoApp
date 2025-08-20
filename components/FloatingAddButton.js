import React from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';

const FloatingAddButton = ({ onPress, disabled }) => {
  return (
    <TouchableOpacity 
      style={styles.floatingButton} 
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={disabled ? ['#666', '#444'] : [COLORS.accent, '#4dd100cc']}
        style={styles.gradient}
      >
        <Ionicons name="add" size={40} color={COLORS.primary} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.6,
    shadowRadius: 4.65,
    elevation: 8,
  },
  gradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#68f70b33',
    boxShadow: 'inset 2px 2px 4px 2px rgba(0,0,0,.2)'
  },
});

export default FloatingAddButton;