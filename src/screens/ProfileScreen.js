import React, { useState } from 'react';
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

export default function ProfileScreen({ navigation }) {
  const { user, userProfile, logout, deleteAccount } = useAuth();
  const language = userProfile?.language || 'en';

  const getTranslation = (key) => {
    const translations = {
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
    backgroundColor: '#ddd',
    marginVertical: 20,
  },
});