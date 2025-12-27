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
  const { user, userProfile, logout, deleteAccount, adsRemoved, setAdsRemoved, handleRestorePurchases } = useAuth();
  const [isLoadingPurchase, setIsLoadingPurchase] = useState(false);
  const [productPrice, setProductPrice] = useState('');
  const [isPriceLoading, setIsPriceLoading] = useState(true);
  
  const language = userProfile?.language || 'en';

  // 상품 가격 가져오기
  useEffect(() => {
    const fetchProducts = async () => {
      if (isIAPAvailable() && !adsRemoved) {
        setIsPriceLoading(true);
        const products = await getProducts();
        if (products.length > 0) {
          setProductPrice(products[0].localizedPrice || products[0].price || '');
        }
        setIsPriceLoading(false);
      } else {
        setIsPriceLoading(false);
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
      restoreHint: {
        en: 'Restore previous purchase after reinstalling or changing device',
        es: 'Restaurar compra anterior después de reinstalar o cambiar de dispositivo',
        zh: '重新安装或更换设备后恢复之前的购买',
        ja: '再インストールまたは機種変更後に以前の購入を復元'
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
      purchaseSuccess: {
        en: 'Ads have been removed!',
        es: '¡Los anuncios han sido eliminados!',
        zh: '广告已移除！',
        ja: '広告が削除されました！'
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
      iapUnavailable: {
        en: 'In-app purchase is temporarily unavailable. Please try again later.',
        es: 'La compra dentro de la aplicación no está disponible temporalmente. Inténtelo más tarde.',
        zh: '应用内购买暂时不可用。请稍后再试。',
        ja: 'アプリ内課金は現在利用できません。後でもう一度お試しください。'
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
      console.log('IAP not available on this device');
      return;
    }

    setIsLoadingPurchase(true);
    try {
      console.log('Starting RevenueCat purchase...');

      // RevenueCat 구매 요청 - 직접 결과 반환
      const success = await purchaseRemoveAds();
      
      if (success) {
        console.log('Purchase successful!');
        // 상태 업데이트는 AuthContext에서 자동 처리됨
        Alert.alert(
          getTranslation('success') || 'Success',
          getTranslation('purchaseSuccess') || 'Ads have been removed!'
        );
      }
    } catch (error) {
      console.error('Purchase error:', error);
      // 에러 발생해도 Alert 표시 안 함 - 조용히 처리
    } finally {
      setIsLoadingPurchase(false);
    }
  };

  const handleRestore = async () => {
    if (!isIAPAvailable()) {
      console.log('IAP not available on this device');
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
      }
      // 복원할 구매가 없으면 조용히 처리
    } catch (error) {
      console.error('Restore error:', error);
      // 에러 발생해도 Alert 표시 안 함
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

          {/* 프로필 편집 */}
          <TouchableOpacity
            style={styles.missionButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.missionButtonText}>
              ✏️ {language === 'en' ? 'Edit Profile' : language === 'es' ? 'Editar Perfil' : language === 'zh' ? '编辑资料' : 'プロフィール編集'}
            </Text>
            <Text style={styles.missionButtonArrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 미션 섹션 */}
          <TouchableOpacity
            style={styles.missionButton}
            onPress={() => navigation.navigate('Missions')}
          >
            <Text style={styles.missionButtonText}>
              🎯 {language === 'en' ? 'Daily Missions' : language === 'es' ? 'Misiones Diarias' : language === 'zh' ? '每日任务' : 'デイリーミッション'}
            </Text>
            <Text style={styles.missionButtonArrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 리더보드 */}
          <TouchableOpacity
            style={styles.missionButton}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <Text style={styles.missionButtonText}>
              🏆 {language === 'en' ? 'Leaderboard' : language === 'es' ? 'Clasificación' : language === 'zh' ? '排行榜' : 'リーダーボード'}
            </Text>
            <Text style={styles.missionButtonArrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 그룹 채팅 */}
          <TouchableOpacity
            style={styles.missionButton}
            onPress={() => navigation.navigate('GroupChatList')}
          >
            <Text style={styles.missionButtonText}>
              💬 {language === 'en' ? 'Group Chats' : language === 'es' ? 'Chats Grupales' : language === 'zh' ? '群组聊天' : 'グループチャット'}
            </Text>
            <Text style={styles.missionButtonArrow}>→</Text>
          </TouchableOpacity>

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

              {isPriceLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#5856D6" />
                </View>
              ) : productPrice ? (
                <>
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
                  <Text style={styles.restoreHintText}>
                    {getTranslation('restoreHint')}
                  </Text>
                </>
              ) : (
                <Text style={styles.iapUnavailableText}>
                  {getTranslation('iapUnavailable')}
                </Text>
              )}
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
  restoreHintText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  iapUnavailableText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
    lineHeight: 20,
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
  missionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  missionButtonArrow: {
    fontSize: 18,
    color: '#5856D6',
  },
});
