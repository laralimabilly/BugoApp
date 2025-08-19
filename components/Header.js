import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

const Header = ({ isLocationEnabled, itemCount }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Don't Forget</Text>
      <Text style={styles.headerSubtitle}>
        {isLocationEnabled ? `${itemCount} items tracked` : 'Location disabled'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default Header;