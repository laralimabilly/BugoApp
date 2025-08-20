// components/AdBanner.js - Banner ad component
import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { AdMobBanner } from 'expo-ads-admob';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

const AdBanner = ({ style, testMode = __DEV__ }) => {
  const [adFailedToLoad, setAdFailedToLoad] = useState(false);

  const adUnitID = testMode 
    ? 'ca-app-pub-3940256099942544/6300978111' // Test banner ID
    : 'ca-app-pub-YOUR_ACTUAL_ID/banner'; // Replace with your actual ad unit ID

  const handleAdFailedToLoad = (error) => {
    console.log('Banner ad failed to load:', error);
    setAdFailedToLoad(true);
  };

  if (adFailedToLoad) {
    return null; // Don't show anything if ad fails to load
  }

  return (
    <View style={[styles.container, style]}>
      <AdMobBanner
        bannerSize="banner"
        adUnitID={adUnitID}
        servePersonalizedAds={true}
        onDidFailToReceiveAdWithError={handleAdFailedToLoad}
        style={styles.banner}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 8,
    marginHorizontal: -24, // Extend to screen edges
  },
  banner: {
    backgroundColor: 'transparent',
  },
});

export default AdBanner;