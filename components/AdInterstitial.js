// components/AdInterstitial.js - Interstitial ad manager
import { AdMobInterstitial } from 'expo-ads-admob';

export class InterstitialAdManager {
  static isAdReady = false;
  static lastAdShown = 0;
  static AD_COOLDOWN = 300000; // 5 minutes
  static TEST_AD_UNIT = 'ca-app-pub-3940256099942544/1033173712';
  static PROD_AD_UNIT = 'ca-app-pub-YOUR_ACTUAL_ID/interstitial'; // Replace with actual

  static async initialize() {
    try {
      const adUnitID = __DEV__ ? this.TEST_AD_UNIT : this.PROD_AD_UNIT;
      await AdMobInterstitial.setAdUnitID(adUnitID);
      await this.loadAd();
    } catch (error) {
      console.error('Failed to initialize interstitial ad:', error);
    }
  }

  static async loadAd() {
    try {
      await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
      this.isAdReady = true;
      console.log('Interstitial ad loaded');
    } catch (error) {
      console.error('Failed to load interstitial ad:', error);
      this.isAdReady = false;
    }
  }

  static async showAd() {
    const now = Date.now();
    
    // Check cooldown period
    if (now - this.lastAdShown < this.AD_COOLDOWN) {
      console.log('Ad cooldown active, skipping');
      return false;
    }

    if (!this.isAdReady) {
      console.log('Ad not ready, loading...');
      await this.loadAd();
      return false;
    }

    try {
      await AdMobInterstitial.showAdAsync();
      this.lastAdShown = now;
      this.isAdReady = false;
      
      // Preload next ad
      setTimeout(() => this.loadAd(), 1000);
      
      return true;
    } catch (error) {
      console.error('Failed to show interstitial ad:', error);
      return false;
    }
  }

  static canShowAd() {
    const now = Date.now();
    return this.isAdReady && (now - this.lastAdShown >= this.AD_COOLDOWN);
  }
}
