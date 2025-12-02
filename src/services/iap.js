import { Platform } from 'react-native';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// 웹에서는 IAP를 import하지 않음
let Purchases;
if (Platform.OS !== 'web') {
  try {
    Purchases = require('react-native-purchases').default;
  } catch (e) {
    console.log('react-native-purchases not available');
  }
}

// RevenueCat API 키
const REVENUECAT_API_KEY_IOS = 'appl_YOUR_REVENUECAT_IOS_KEY';
const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_REVENUECAT_ANDROID_KEY';

// 상품 ID
export const PRODUCT_IDS = {
  REMOVE_ADS: 'com.tetratalk.app.removeads',
};

// IAP 초기화
export const initializeIAP = async (userId) => {
  if (Platform.OS === 'web' || !Purchases) {
    console.log('IAP not available on web');
    return false;
  }

  try {
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
    
    await Purchases.configure({
      apiKey,
      appUserID: userId,
    });
    
    console.log('IAP initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing IAP:', error);
    return false;
  }
};

// 구매 가능한 상품 목록 가져오기
export const getProducts = async () => {
  if (Platform.OS === 'web' || !Purchases) {
    return [];
  }

  try {
    const offerings = await Purchases.getOfferings();
    
    if (offerings.current && offerings.current.availablePackages.length > 0) {
      return offerings.current.availablePackages;
    }
    
    return [];
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
};

// 광고 제거 구매
export const purchaseRemoveAds = async (userId) => {
  if (Platform.OS === 'web' || !Purchases) {
    console.log('IAP not available');
    return { success: false, error: 'IAP not available on this platform' };
  }

  try {
    const offerings = await Purchases.getOfferings();
    
    if (!offerings.current || offerings.current.availablePackages.length === 0) {
      return { success: false, error: 'No products available' };
    }

    // 광고 제거 패키지 찾기
    const removeAdsPackage = offerings.current.availablePackages.find(
      pkg => pkg.identifier === PRODUCT_IDS.REMOVE_ADS || pkg.product.identifier === PRODUCT_IDS.REMOVE_ADS
    ) || offerings.current.availablePackages[0];

    const { customerInfo } = await Purchases.purchasePackage(removeAdsPackage);
    
    // 구매 성공 시 Firebase에 상태 저장
    if (customerInfo.entitlements.active['remove_ads']) {
      await updateUserPremiumStatus(userId, true);
      return { success: true, customerInfo };
    }

    return { success: true, customerInfo };
  } catch (error) {
    if (error.userCancelled) {
      return { success: false, error: 'cancelled' };
    }
    console.error('Error purchasing:', error);
    return { success: false, error: error.message };
  }
};

// 구매 복원
export const restorePurchases = async (userId) => {
  if (Platform.OS === 'web' || !Purchases) {
    return { success: false, error: 'IAP not available on this platform' };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    
    const hasRemoveAds = customerInfo.entitlements.active['remove_ads'];
    
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
  if (Platform.OS === 'web' || !Purchases) {
    // 웹에서는 Firebase에서 상태 확인
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
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const hasRemoveAds = customerInfo.entitlements.active['remove_ads'];
    
    // Firebase에도 동기화
    if (hasRemoveAds) {
      await updateUserPremiumStatus(userId, true);
    }
    
    return hasRemoveAds;
  } catch (error) {
    console.error('Error checking premium status:', error);
    // 에러 시 Firebase에서 확인
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data().isPremium || false;
      }
    } catch (e) {
      console.error('Error checking Firebase premium status:', e);
    }
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
  if (Platform.OS === 'web' || !Purchases) {
    return '$2.99'; // 웹에서는 기본 가격 표시
  }

  try {
    const offerings = await Purchases.getOfferings();
    
    if (offerings.current && offerings.current.availablePackages.length > 0) {
      const removeAdsPackage = offerings.current.availablePackages.find(
        pkg => pkg.identifier === PRODUCT_IDS.REMOVE_ADS || pkg.product.identifier === PRODUCT_IDS.REMOVE_ADS
      ) || offerings.current.availablePackages[0];
      
      return removeAdsPackage.product.priceString;
    }
    
    return '$2.99';
  } catch (error) {
    console.error('Error getting price:', error);
    return '$2.99';
  }
};
