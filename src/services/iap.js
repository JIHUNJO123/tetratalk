import { Platform } from 'react-native';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// 웹에서는 IAP를 import하지 않음
let RNIap;
if (Platform.OS !== 'web') {
  try {
    RNIap = require('react-native-iap');
  } catch (e) {
    console.log('react-native-iap not available');
  }
}

// 상품 ID
export const PRODUCT_IDS = {
  REMOVE_ADS: Platform.select({
    ios: 'com.tetratalk.app.removeads',
    android: 'com.tetratalk.app.removeads',
  }),
};

// IAP 초기화
export const initializeIAP = async () => {
  if (Platform.OS === 'web' || !RNIap) {
    console.log('IAP not available on web');
    return false;
  }

  try {
    await RNIap.initConnection();
    console.log('IAP initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing IAP:', error);
    return false;
  }
};

// IAP 연결 종료
export const endIAPConnection = async () => {
  if (Platform.OS === 'web' || !RNIap) return;
  
  try {
    await RNIap.endConnection();
  } catch (error) {
    console.error('Error ending IAP connection:', error);
  }
};

// 구매 가능한 상품 목록 가져오기
export const getProducts = async () => {
  if (Platform.OS === 'web' || !RNIap) {
    return [];
  }

  try {
    const products = await RNIap.getProducts({ skus: [PRODUCT_IDS.REMOVE_ADS] });
    return products;
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
};

// 광고 제거 구매
export const purchaseRemoveAds = async (userId) => {
  if (Platform.OS === 'web' || !RNIap) {
    console.log('IAP not available');
    return { success: false, error: 'IAP not available on this platform' };
  }

  try {
    const purchase = await RNIap.requestPurchase({ sku: PRODUCT_IDS.REMOVE_ADS });
    
    // 구매 성공 시 Firebase에 상태 저장
    if (purchase) {
      await updateUserPremiumStatus(userId, true);
      
      // 구매 완료 처리 (iOS에서 필요)
      if (Platform.OS === 'ios') {
        await RNIap.finishTransaction({ purchase, isConsumable: false });
      }
      
      return { success: true, purchase };
    }

    return { success: false, error: 'Purchase failed' };
  } catch (error) {
    if (error.code === 'E_USER_CANCELLED') {
      return { success: false, error: 'cancelled' };
    }
    console.error('Error purchasing:', error);
    return { success: false, error: error.message };
  }
};

// 구매 복원
export const restorePurchases = async (userId) => {
  if (Platform.OS === 'web' || !RNIap) {
    return { success: false, error: 'IAP not available on this platform' };
  }

  try {
    const purchases = await RNIap.getAvailablePurchases();
    
    const hasRemoveAds = purchases.some(
      purchase => purchase.productId === PRODUCT_IDS.REMOVE_ADS
    );
    
    if (hasRemoveAds) {
      await updateUserPremiumStatus(userId, true);
      return { success: true, restored: true };
    }

    return { success: true, restored: false };
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return { success: false, error: error.message };
  }
};

// 프리미엄 상태 확인
export const checkPremiumStatus = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().isPremium || false;
    }
    return false;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
};

// Firebase에 프리미엄 상태 업데이트
const updateUserPremiumStatus = async (userId, isPremium) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      isPremium: isPremium,
      premiumUpdatedAt: new Date().toISOString(),
    });
    console.log('Premium status updated in Firebase');
  } catch (error) {
    console.error('Error updating premium status:', error);
  }
};

// 가격 정보 가져오기
export const getRemoveAdsPrice = async () => {
  if (Platform.OS === 'web' || !RNIap) {
    return '$2.99'; // 웹에서는 기본 가격 표시
  }

  try {
    const products = await RNIap.getProducts({ skus: [PRODUCT_IDS.REMOVE_ADS] });
    
    if (products && products.length > 0) {
      return products[0].localizedPrice;
    }
    
    return '$2.99';
  } catch (error) {
    console.error('Error getting price:', error);
    return '$2.99';
  }
};
