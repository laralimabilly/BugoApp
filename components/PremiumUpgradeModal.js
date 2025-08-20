// components/PremiumUpgradeModal.js - Premium upgrade modal
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { PremiumManager } from '../utils/premium';

const PremiumUpgradeModal = ({ visible, onClose, onUpgradeSuccess }) => {
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const premiumFeatures = [
    { icon: 'infinite-outline', title: 'Unlimited Items', desc: 'Track as many items as you want' },
    { icon: 'color-palette-outline', title: 'All Icons', desc: '20+ beautiful icons to choose from' },
    { icon: 'settings-outline', title: 'Custom Distances', desc: 'Set any alert distance (1m - 1000m)' },
    { icon: 'time-outline', title: 'Quiet Hours', desc: 'Schedule notification-free times' },
    { icon: 'cloud-outline', title: 'Cloud Backup', desc: 'Sync across all your devices' },
    { icon: 'analytics-outline', title: 'Location History', desc: 'See where you forget items most' },
    { icon: 'notifications-off-outline', title: 'No Ads', desc: 'Enjoy a clean, ad-free experience' },
    { icon: 'headset-outline', title: 'Priority Support', desc: 'Get help when you need it' },
  ];

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const result = await PremiumManager.purchasePremium();
      if (result.success) {
        Alert.alert(
          'Welcome to Premium!',
          'Thank you for upgrading! You now have access to all premium features.',
          [{ text: 'OK', onPress: () => { onUpgradeSuccess(); onClose(); } }]
        );
      } else {
        Alert.alert('Purchase Failed', result.error || 'Unable to complete purchase');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const result = await PremiumManager.restorePurchases();
      if (result.success) {
        if (result.restored) {
          Alert.alert(
            'Purchases Restored!',
            'Your premium features have been restored.',
            [{ text: 'OK', onPress: () => { onUpgradeSuccess(); onClose(); } }]
          );
        } else {
          Alert.alert('No Purchases Found', 'No previous purchases to restore.');
        }
      } else {
        Alert.alert('Restore Failed', result.error || 'Unable to restore purchases');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient colors={['#2d2d2d', '#1a1a1a']} style={styles.gradient}>
            
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Ionicons name="star" size={24} color={COLORS.accent} />
                <Text style={styles.title}>Upgrade to Premium</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.price}>$3.99</Text>
              <Text style={styles.priceDesc}>One-time purchase</Text>
            </View>

            {/* Features */}
            <ScrollView style={styles.featuresContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.featuresTitle}>Premium Features</Text>
              {premiumFeatures.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name={feature.icon} size={20} color={COLORS.accent} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDesc}>{feature.desc}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.restoreButton} 
                onPress={handleRestore}
                disabled={restoring}
              >
                {restoring ? (
                  <ActivityIndicator size="small" color={COLORS.textSecondary} />
                ) : (
                  <Text style={styles.restoreText}>Restore Purchases</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.purchaseButton} 
                onPress={handlePurchase}
                disabled={purchasing}
              >
                <LinearGradient
                  colors={[COLORS.accent, '#4dd100']}
                  style={styles.purchaseGradient}
                >
                  {purchasing ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <>
                      <Ionicons name="star" size={20} color={COLORS.primary} />
                      <Text style={styles.purchaseText}>Upgrade Now</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 20,
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  priceDesc: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  featuresContainer: {
    flex: 1,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.glass,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(104, 247, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actions: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  restoreButton: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  restoreText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  purchaseButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  purchaseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  purchaseText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default PremiumUpgradeModal;