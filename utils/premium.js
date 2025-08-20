// utils/premium.js - Premium features management
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as InAppPurchases from 'expo-in-app-purchases';

export const PREMIUM_PRODUCT_ID = 'com.yourcompany.dontforget.premium';
export const FREE_ITEM_LIMIT = 5;

export class PremiumManager {
  static async isPremiumUser() {
    try {
      const isPremium = await AsyncStorage.getItem('isPremium');
      return isPremium === 'true';
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }

  static async setPremiumStatus(isPremium) {
    try {
      await AsyncStorage.setItem('isPremium', isPremium.toString());
    } catch (error) {
      console.error('Error setting premium status:', error);
    }
  }

  static async purchasePremium() {
    try {
      await InAppPurchases.connectAsync();
      
      // Get available products
      const products = await InAppPurchases.getProductsAsync([PREMIUM_PRODUCT_ID]);
      if (products.results.length === 0) {
        throw new Error('Premium product not available');
      }

      // Purchase the product
      const result = await InAppPurchases.purchaseItemAsync(PREMIUM_PRODUCT_ID);
      
      if (result.responseCode === InAppPurchases.IAPResponseCode.OK) {
        await this.setPremiumStatus(true);
        return { success: true, result };
      } else {
        return { success: false, error: 'Purchase failed' };
      }
    } catch (error) {
      console.error('Purchase error:', error);
      return { success: false, error: error.message };
    } finally {
      await InAppPurchases.disconnectAsync();
    }
  }

  static async restorePurchases() {
    try {
      await InAppPurchases.connectAsync();
      const history = await InAppPurchases.getPurchaseHistoryAsync();
      
      const hasPremium = history.results.some(
        purchase => purchase.productId === PREMIUM_PRODUCT_ID
      );
      
      if (hasPremium) {
        await this.setPremiumStatus(true);
        return { success: true, restored: true };
      }
      
      return { success: true, restored: false };
    } catch (error) {
      console.error('Restore error:', error);
      return { success: false, error: error.message };
    } finally {
      await InAppPurchases.disconnectAsync();
    }
  }

  static canAddMoreItems(currentItemCount) {
    return currentItemCount < FREE_ITEM_LIMIT;
  }

  static getItemLimitMessage(currentItemCount) {
    const remaining = FREE_ITEM_LIMIT - currentItemCount;
    if (remaining <= 0) {
      return `You've reached your ${FREE_ITEM_LIMIT}-item limit! Upgrade to Premium for unlimited items.`;
    }
    return `${remaining} items remaining in free version.`;
  }
}