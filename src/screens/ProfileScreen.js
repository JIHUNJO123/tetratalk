import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { purchaseRemoveAds, getProducts, isIAPAvailable } from '../services/iap';

export default function ProfileScreen({ navigation }) {
  const { user, userProfile, logout, deleteAccount, adsRemoved, handleRestorePurchases } = useAuth();
  const [isLoadingPurchase, setIsLoadingPurchase] = useState(false);
  const [productPrice, setProductPrice] = useState('$2.99');
  
  const language = userProfile?.language || 'en';

  // 상품 가격 가져오기
  useEffect(() => {
    const fetchProducts = async () => {
      if (isIAPAvailable() && !adsRemoved) {
        const products = await getProducts();
        if (products.length > 0) {
          setProductPrice(products[0].localizedPrice || products[0].price || '$2.99');
        }
      }
    };
    fetchProducts();
  }, [adsRemoved]);

  const getTranslation = (key) => {
    const translations = {
      removeAds: {
        en: '🚫 Remove Ads',
        es: '🚫 Eliminar Anuncios',
        zh: '🚫 移除广告',
        ja: '🚫 広告を削除'
      },
      removeAdsDesc: {
        en: 'Enjoy an ad-free experience with a one-time purchase.',
        es: 'Disfruta de una experiencia sin anuncios con una compra única.',
        zh: '一次性购买，享受无广告体验。',
        ja: '1回限りの購入で広告なしの体験をお楽しみください。'
      },
      adsRemoved: {
        en: '✓ Ads Removed',
        es: '✓ Anuncios Eliminados',
        zh: '✓ 广告已移除',
        ja: '✓ 広告削除済み'
      },
      restore: {
        en: 'Restore Purchases',
        es: 'Restaurar Compras',
        zh: '恢复购买',
        ja: '購入を復元'
      },
      restored: {
        en: 'Restored',
        es: 'Restaurado',
        zh: '已恢复',
        ja: '復元完了'
      },
      restoredMsg: {
        en: 'Your purchase has been restored.',
        es: 'Su compra ha sido restaurada.',
        zh: '您的购买已恢复。',
        ja: '購入が復元されました。'
      },
      noPurchases: {
        en: 'No Purchases',
        es: 'Sin Compras',
        zh: '无购买记录',
        ja: '購入なし'
      },
      noPurchasesMsg: {
        en: 'No previous purchases found.',
        es: 'No se encontraron compras anteriores.',
        zh: '未找到以前的购买记录。',
        ja: '以前の購入履歴がありません。'
      },
      notAvailable: {
        en: 'Not Available',
        es: 'No Disponible',
        zh: '不可用',
        ja: '利用不可'
      },
      notAvailableMsg: {
        en: 'In-app purchases are not available on this device.',
        es: 'Las compras integradas no están disponibles en este dispositivo.',
        zh: '此设备不支持应用内购买。',
        ja: 'このデバイスではアプリ内購入は利用できません。'
      },
      deleteAccount: {
        en: 'Delete Account',
        es: 'Eliminar Cuenta',
        zh: '删除账户',
        ja: '会員退会'
      },
      deleteConfirm: {
        en: 'Are you sure you want to delete your account? This action cannot be undone.',
        es: '¿Está seguro de que desea eliminar su cuenta? Esta acción no se puede deshacer.',
        zh: '您确定要删除您的账户吗？此操作无法撤消。',
        ja: '会員退会しますか？この操作は元に戻せません。'
      },
      cancel: {
        en: 'Cancel',
        es: 'Cancelar',
        zh: '取消',
        ja: 'キャンセル'
      },
      delete: {
        en: 'Delete',
        es: 'Eliminar',
        zh: '删除',
        ja: '退会'
      },
      success: {
        en: 'Success',
        es: 'Éxito',
        zh: '成功',
        ja: '成功'
      },
      accountDeleted: {
        en: 'Account deleted successfully.',
        es: 'Cuenta eliminada exitosamente.',
        zh: '账户删除成功。',
        ja: '会員退会が完了しました。'
      },
      error: {
        en: 'Error',
        es: 'Error',
        zh: '错误',
        ja: 'エラー'
      },
      deleteFailed: {
        en: 'Failed to delete account.',
        es: 'Error al eliminar cuenta.',
        zh: '删除账户失败。',
        ja: '会員退会に失敗しました。'
      },
      purchaseFailed: {
        en: 'Purchase failed.',
        es: 'La compra falló.',
        zh: '购买失败。',
        ja: '購入に失敗しました。'
      },
      restoreFailed: {
        en: 'Failed to restore purchases.',
        es: 'Error al restaurar compras.',
        zh: '恢复购买失败。',
        ja: '購入の復元に失敗しました。'
      },
      back: {
        en: '← Back',
        es: '← Volver',
        zh: '← 返回',
        ja: '← 戻る'
      },
      settings: {
        en: 'Settings',
        es: 'Configuración',
        zh: '设置',
        ja: '設定'
      },
      nickname: {
        en: 'Nickname',
        es: 'Apodo',
        zh: '昵称',
        ja: 'ニックネーム'
      },
      logout: {
        en: 'Logout',
        es: 'Salir',
        zh: '登出',
        ja: 'ログアウト'
      }
    };
    return translations[key]?.[language] || translations[key]?.en || '';
  };

  const handlePurchaseRemoveAds = async () => {
    if (!isIAPAvailable()) {
      Alert.alert(
        getTranslation('notAvailable'),
        getTranslation('notAvailableMsg')
      );
      return;
    }

    setIsLoadingPurchase(true);
    try {
      console.log('Starting purchase...');

      // 구매 전에 상품 정보 먼저 가져오기(필수)
      const products = await getProducts();
      if (!products || products.length === 0) {
        throw new Error('Product not found. Please try again later.');
      }
      console.log('Products loaded:', products);

      await purchaseRemoveAds();
      console.log('Purchase request sent');
      // 결과는 AuthContext의 purchaseListener에서 처리됨
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(
        getTranslation('error'),
        `${getTranslation('purchaseFailed')}\n\n${error.message || error}`
      );
    } finally {
      setIsLoadingPurchase(false);
    }
  };

  const handleRestore = async () => {
    if (!isIAPAvailable()) {
      Alert.alert(
        getTranslation('notAvailable'),
        getTranslation('notAvailableMsg')
      );
      return;
    }

    setIsLoadingPurchase(true);
    try {
      const restored = await handleRestorePurchases();
      if (restored) {
        Alert.alert(
          getTranslation('restored'),
          getTranslation('restoredMsg')
        );
      } else {
        Alert.alert(
          getTranslation('noPurchases'),
          getTranslation('noPurchasesMsg')
        );
      }
    } catch (error) {
      Alert.alert(
        getTranslation('error'),
        getTranslation('restoreFailed')
      );
    } finally {
      setIsLoadingPurchase(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      getTranslation('deleteAccount'),
      getTranslation('deleteConfirm'),
      [
        { text: getTranslation('cancel'), style: 'cancel' },
        {
          text: getTranslation('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              Alert.alert(getTranslation('success'), getTranslation('accountDeleted'));
            } catch (error) {
              Alert.alert(getTranslation('error'), getTranslation('deleteFailed'));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>{getTranslation('back')}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {getTranslation('settings')}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              {getTranslation('nickname')}
            </Text>
            <Text style={styles.value}>{userProfile?.displayName}</Text>
          </View>

          <View style={styles.divider} />

          {/* 광고 제거 섹션 */}
          {!adsRemoved ? (
            <View style={styles.adSection}>
              <Text style={styles.adSectionTitle}>
                {getTranslation('removeAds')}
              </Text>
              <Text style={styles.adSectionDesc}>
                {getTranslation('removeAdsDesc')}
              </Text>

              <TouchableOpacity
                style={[styles.button, styles.purchaseButton]}
                onPress={handlePurchaseRemoveAds}
                disabled={isLoadingPurchase}
              >
                {isLoadingPurchase ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {language === 'en' ? `Remove Ads - ${productPrice}` :
                     language === 'ja' ? `広告を削除 - ${productPrice}` :
                     language === 'zh' ? `移除广告 - ${productPrice}` :
                     `Eliminar Anuncios - ${productPrice}`}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.restoreButton}
                onPress={handleRestore}
                disabled={isLoadingPurchase}
              >
                <Text style={styles.restoreButtonText}>
                  {getTranslation('restore')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.adRemovedSection}>
              <Text style={styles.adRemovedText}>
                {getTranslation('adsRemoved')}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={logout}
          >
            <Text style={styles.buttonText}>
              {getTranslation('logout')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.buttonText}>
              {getTranslation('deleteAccount')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#5f4dee',
  },
  container: {
    flex: 1,
    backgroundColor: '#5f4dee',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerSpacer: {
    width: 60,
  },
  backButton: {
    padding: 10,
    minWidth: 60,
  },
  backButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF9500',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 20,
  },
  adSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  adSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  adSectionDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  purchaseButton: {
    backgroundColor: '#5856D6',
  },
  restoreButton: {
    padding: 12,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#5856D6',
    fontSize: 14,
  },
  adRemovedSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  adRemovedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5856D6',
  },
});
