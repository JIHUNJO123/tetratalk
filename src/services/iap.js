// 인앱결제 서비스 - RevenueCat 사용
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

// RevenueCat API Keys
const REVENUECAT_API_KEY_IOS = 'appl_ItMxZlggOGKzpTCrdCmqzsCXmNV';
const REVENUECAT_API_KEY_ANDROID = 'goog_wAekkfzrZHgRLHbUPqNTPXsjYFD'; // Android 키 추가 시 교체

// 상품 ID
export const PRODUCT_IDS = {
  REMOVE_ADS: 'com.tetratalk.app.removeads',
};

// Entitlement ID (RevenueCat 대시보드에서 설정한 것)
const ENTITLEMENT_ID = 'remove_ads';

let isConfigured = false;

// RevenueCat 초기화
export async function initializeIAP() {
  try {
    if (isConfigured) {
      console.log('RevenueCat already configured');
      return true;
    }

    if (!isIAPAvailable()) {
      console.log('IAP not available on this platform');
      return false;
    }

    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
    
    await Purchases.configure({ apiKey });
    console.log('RevenueCat configured successfully');
    isConfigured = true;

    return true;
  } catch (error) {
    console.error('RevenueCat configuration failed:', error);
    isConfigured = false;
    return false;
  }
}

// 사용자 ID 설정 (Firebase UID 연동)
export async function setRevenueCatUserId(userId) {
  try {
    if (!isConfigured) {
      await initializeIAP();
    }
    
    if (userId) {
      await Purchases.logIn(userId);
      console.log('RevenueCat user logged in:', userId);
    }
  } catch (error) {
    console.error('RevenueCat login error:', error);
  }
}

// 상품 정보 가져오기
export async function getProducts() {
  try {
    if (!isConfigured) {
      await initializeIAP();
    }

    const offerings = await Purchases.getOfferings();
    console.log('Offerings:', JSON.stringify(offerings, null, 2));

    if (offerings.current && offerings.current.availablePackages.length > 0) {
      // 패키지를 상품 형태로 변환
      const products = offerings.current.availablePackages.map(pkg => ({
        productId: pkg.product.identifier,
        localizedPrice: pkg.product.priceString,
        price: pkg.product.price,
        title: pkg.product.title,
        description: pkg.product.description,
        package: pkg, // 구매 시 필요
      }));
      
      console.log('Products fetched:', products.length);
      return products;
    }

    console.log('No offerings available');
    return [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// 광고 제거 구매
export async function purchaseRemoveAds() {
  try {
    if (!isConfigured) {
      await initializeIAP();
    }

    // 현재 offering에서 패키지 가져오기
    const offerings = await Purchases.getOfferings();
    
    if (!offerings.current || offerings.current.availablePackages.length === 0) {
      console.log('No packages available for purchase');
      return false;
    }

    // 첫 번째 패키지 (Lifetime) 구매
    const packageToPurchase = offerings.current.availablePackages[0];
    console.log('Purchasing package:', packageToPurchase.identifier);

    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    console.log('Purchase successful:', customerInfo);

    // Entitlement 확인
    if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
      console.log('Remove ads entitlement active');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Purchase failed:', error);
    
    // 사용자 취소
    if (error.userCancelled) {
      console.log('User cancelled purchase');
      return false;
    }
    
    throw error;
  }
}

// 구매 복원
export async function restorePurchases() {
  try {
    if (!isConfigured) {
      await initializeIAP();
    }

    const customerInfo = await Purchases.restorePurchases();
    console.log('Restore result:', customerInfo);

    // Entitlement 확인
    if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
      console.log('Remove ads entitlement restored');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Restore failed:', error);
    return false;
  }
}

// 현재 구독/구매 상태 확인
export async function checkPurchaseStatus() {
  try {
    if (!isConfigured) {
      await initializeIAP();
    }

    const customerInfo = await Purchases.getCustomerInfo();
    
    // Entitlement 확인
    const hasRemoveAds = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    console.log('Has remove ads:', hasRemoveAds);
    
    return hasRemoveAds;
  } catch (error) {
    console.error('Error checking purchase status:', error);
    return false;
  }
}

// 구매 리스너 설정 (호환성 유지)
export function setPurchaseListener(onPurchaseSuccess, onPurchaseError) {
  // RevenueCat은 purchasePackage가 직접 결과 반환하므로 리스너 불필요
  return () => {};
}

// 연결 해제 (호환성 유지)
export async function disconnectIAP() {
  console.log('RevenueCat disconnect (no-op)');
}

// 앱 환경 체크
export function isIAPAvailable() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
