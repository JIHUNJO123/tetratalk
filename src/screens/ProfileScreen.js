import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { doc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { purchaseRemoveAds, restorePurchases, checkPremiumStatus, getRemoveAdsPrice } from '../services/iap';

export default function ProfileScreen({ navigation }) {
  const { user, userProfile, logout, deleteAccount } = useAuth();
  const language = userProfile?.language || 'en';
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState('$2.99');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const loadPremiumStatus = async () => {
      if (user?.uid) {
        const premium = await checkPremiumStatus(user.uid);
        setIsPremium(premium);
        const priceStr = await getRemoveAdsPrice();
        setPrice(priceStr);
      }
    };
    loadPremiumStatus();
  }, [user]);

  const getTranslation = (key) => {
    const translations = {
      removeAds: {
        en: 'Remove Ads',
        es: 'Eliminar Anuncios',
        zh: '移除广告',
        ja: '広告を削除'
      },
      removeAdsDesc: {
        en: 'Enjoy ad-free experience',
        es: 'Disfrute de una experiencia sin anuncios',
        zh: '享受无广告体验',
        ja: '広告なしの体験をお楽しみください'
      },
      purchase: {
        en: 'Purchase',
        es: 'Comprar',
        zh: '购买',
        ja: '購入'
      },
      restore: {
        en: 'Restore Purchases',
        es: 'Restaurar Compras',
        zh: '恢复购买',
        ja: '購入を復元'
      },
      premiumActive: {
        en: '✓ Premium Active',
        es: '✓ Premium Activo',
        zh: '✓ 高级版已激活',
        ja: '✓ プレミアム有効'
      },
      purchaseSuccess: {
        en: 'Purchase Successful',
        es: 'Compra Exitosa',
        zh: '购买成功',
        ja: '購入完了'
      },
      purchaseSuccessMsg: {
        en: 'Ads have been removed. Thank you for your purchase!',
        es: '¡Los anuncios han sido eliminados. Gracias por su compra!',
        zh: '广告已删除。感谢您的购买！',
        ja: '広告が削除されました。ご購入ありがとうございます！'
      },
      purchaseFailed: {
        en: 'Purchase Failed',
        es: 'Compra Fallida',
        zh: '购买失败',
        ja: '購入失敗'
      },
      restoreSuccess: {
        en: 'Restore Successful',
        es: 'Restauración Exitosa',
        zh: '恢复成功',
        ja: '復元完了'
      },
      restoreSuccessMsg: {
        en: 'Your purchase has been restored.',
        es: 'Su compra ha sido restaurada.',
        zh: '您的购买已恢复。',
        ja: '購入が復元されました。'
      },
      noPurchases: {
        en: 'No Purchases Found',
        es: 'No se Encontraron Compras',
        zh: '未找到购买记录',
        ja: '購入履歴がありません'
      },
      noPurchasesMsg: {
        en: 'No previous purchases found to restore.',
        es: 'No se encontraron compras anteriores para restaurar.',
        zh: '没有找到可恢复的购买记录。',
        ja: '復元可能な購入履歴がありません。'
      },
      deleteAccount: {
        en: 'Delete Account',
        es: 'Eliminar Cuenta',
        zh: '删除账户',
        ja: 'アカウント削除'
      },
      deleteConfirm: {
        en: 'Are you sure you want to delete your account? This action cannot be undone.',
        es: '¿Está seguro de que desea eliminar su cuenta? Esta acción no se puede deshacer.',
        zh: '您确定要删除您的账户吗？此操作无法撤消。',
        ja: 'アカウントを削除しますか？この操作は元に戻せません。'
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
        ja: '削除'
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
        ja: 'アカウントが削除されました。'
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
        ja: 'アカウント削除に失敗しました。'
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
      email: {
        en: 'Email',
        es: 'Correo',
        zh: '电子邮件',
        ja: 'メールアドレス'
      },
      nickname: {
        en: 'Nickname',
        es: 'Apodo',
        zh: '昵称',
        ja: 'ニックネーム'
      },
      logout: {
        en: 'Logout',
        es: 'Cerrar Sesión',
        zh: '登出',
        ja: 'ログアウト'
      }
    };
    return translations[key]?.[language] || translations[key]?.en || '';
  };

  const handlePurchaseRemoveAds = async () => {
    setIsLoading(true);
    try {
      const result = await purchaseRemoveAds(user.uid);
      if (result.success) {
        setIsPremium(true);
        Alert.alert(
          getTranslation('purchaseSuccess'),
          getTranslation('purchaseSuccessMsg')
        );
      } else if (result.error !== 'cancelled') {
        Alert.alert(
          getTranslation('purchaseFailed'),
          result.error
        );
      }
    } catch (error) {
      Alert.alert(getTranslation('error'), error.message);
    }
    setIsLoading(false);
  };

  const handleRestorePurchases = async () => {
    setIsLoading(true);
    try {
      const result = await restorePurchases(user.uid);
      if (result.success && result.restored) {
        setIsPremium(true);
        Alert.alert(
          getTranslation('restoreSuccess'),
          getTranslation('restoreSuccessMsg')
        );
      } else if (result.success && !result.restored) {
        Alert.alert(
          getTranslation('noPurchases'),
          getTranslation('noPurchasesMsg')
        );
      } else {
        Alert.alert(getTranslation('error'), result.error);
      }
    } catch (error) {
      Alert.alert(getTranslation('error'), error.message);
    }
    setIsLoading(false);
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
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>
            {getTranslation('email')}
          </Text>
          <Text style={styles.value}>{userProfile?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>
            {getTranslation('nickname')}
          </Text>
          <Text style={styles.value}>{userProfile?.displayName}</Text>
        </View>

        <View style={styles.divider} />

        {/* 광고 제거 섹션 */}
        <View style={styles.premiumSection}>
          <Text style={styles.premiumTitle}>{getTranslation('removeAds')}</Text>
          <Text style={styles.premiumDesc}>{getTranslation('removeAdsDesc')}</Text>
          
          {isPremium ? (
            <View style={styles.premiumActive}>
              <Text style={styles.premiumActiveText}>{getTranslation('premiumActive')}</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, styles.purchaseButton, isLoading && styles.buttonDisabled]}
                onPress={handlePurchaseRemoveAds}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {getTranslation('purchase')} ({price})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.restoreButton, isLoading && styles.buttonDisabled]}
                onPress={handleRestorePurchases}
                disabled={isLoading}
              >
                <Text style={styles.restoreButtonText}>
                  {getTranslation('restore')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

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
  );
}

const styles = StyleSheet.create({
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
  backButton: {
    padding: 10,
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#666',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    fontSize: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ff9500',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 20,
  },
  premiumSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  premiumDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  premiumActive: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  premiumActiveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  purchaseButton: {
    backgroundColor: '#5856D6',
    width: '100%',
  },
  restoreButton: {
    padding: 10,
    marginTop: 10,
  },
  restoreButtonText: {
    color: '#5856D6',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});