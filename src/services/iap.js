// 인앱결제 서비스 - 광고 제거 기능 (react-native-iap)
import { Platform } from 'react-native';
import * as RNIap from 'react-native-iap';

// 상품 ID (App Store Connect에서 생성)
export const PRODUCT_IDS = {
  REMOVE_ADS: 'com.tetratalk.app.removeads',
};

const productIds = [PRODUCT_IDS.REMOVE_ADS];

let isConnected = false;

// 인앱결제 초기화
export async function initializeIAP() {
  try {
    if (isConnected) {
      console.log('IAP already connected');
      return true;
    }
    
    const result = await RNIap.initConnection();
    console.log('IAP connection result:', result);
    isConnected = true;

    // iOS에서 pending transactions 정리
    if (Platform.OS === 'ios') {
      try {
        await RNIap.clearTransactionIOS();
      } catch (clearError) {
        console.log('Clear transaction warning:', clearError);
      }
    }

    return true;
  } catch (error) {
    console.error('IAP connection failed:', error);
    isConnected = false;
    return false;
  }
}

// 상품 정보 가져오기
export async function getProducts() {
  try {
    // 연결 확인
    if (!isConnected) {
      await initializeIAP();
    }
    
    console.log('Fetching products with SKUs:', productIds);
    const products = await RNIap.getProducts({ skus: productIds });
    console.log('Products fetched:', JSON.stringify(products, null, 2));
    console.log('Products count:', products?.length || 0);

    return products || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return [];
  }
}

// 광고 제거 구매
export async function purchaseRemoveAds() {
  try {
    // 연결 확인
    if (!isConnected) {
      await initializeIAP();
    }
    
    console.log('Requesting purchase for:', PRODUCT_IDS.REMOVE_ADS);

    // iOS와 Android에서 다른 파라미터 사용
    if (Platform.OS === 'ios') {
      await RNIap.requestPurchase({
        sku: PRODUCT_IDS.REMOVE_ADS,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      });
    } else {
      await RNIap.requestPurchase({
        skus: [PRODUCT_IDS.REMOVE_ADS],
      });
    }

    console.log('Purchase request sent');
    return true;
  } catch (error) {
    console.error('Purchase failed:', error);
    // 사용자 취소는 에러로 처리하지 않음
    if (error.code === 'E_USER_CANCELLED') {
      return false;
    }
    throw error;
  }
}

// 구매 복원 (이전에 구매한 경우)
export async function restorePurchases() {
  try {
    const purchases = await RNIap.getAvailablePurchases();
    console.log('Available purchases:', purchases);

    // 광고 제거 상품이 있는지 확인
    const removeAdsPurchase = purchases?.find(
      (purchase) => purchase.productId === PRODUCT_IDS.REMOVE_ADS
    );

    if (removeAdsPurchase) {
      console.log('Remove ads purchase found');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return false;
  }
}

// 구매 완료 처리 (트랜잭션 종료)
export async function finishTransaction(purchase) {
  try {
    await RNIap.finishTransaction({ purchase, isConsumable: false });
    console.log('Transaction finished');
    return true;
  } catch (error) {
    console.error('Error finishing transaction:', error);
    return false;
  }
}

// 구매 업데이트 리스너 설정
export function setPurchaseListener(onPurchaseSuccess, onPurchaseError) {
  // 구매 성공 리스너
  const purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(async (purchase) => {
    console.log('Purchase updated:', purchase);

    const receipt = purchase.transactionReceipt;
    if (receipt) {
      // 트랜잭션 완료 처리
      await finishTransaction(purchase);

      if (purchase.productId === PRODUCT_IDS.REMOVE_ADS) {
        onPurchaseSuccess && onPurchaseSuccess();
      }
    }
  });

  // 구매 에러 리스너
  const purchaseErrorSubscription = RNIap.purchaseErrorListener((error) => {
    console.error('Purchase error:', error);
    if (error.code !== 'E_USER_CANCELLED') {
      onPurchaseError && onPurchaseError(error.code);
    }
  });

  // cleanup 함수 반환
  return () => {
    purchaseUpdateSubscription.remove();
    purchaseErrorSubscription.remove();
  };
}

// 연결 해제
export async function disconnectIAP() {
  try {
    await RNIap.endConnection();
    console.log('IAP disconnected');
  } catch (error) {
    console.error('Error disconnecting IAP:', error);
  }
}

// 앱 환경 체크
export function isIAPAvailable() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
