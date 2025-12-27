import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

const INTERESTS = [
  { id: 'sports', emoji: '⚽', en: 'Sports', es: 'Deportes', zh: '运动', ja: 'スポーツ' },
  { id: 'music', emoji: '🎵', en: 'Music', es: 'Música', zh: '音乐', ja: '音楽' },
  { id: 'movies', emoji: '🎬', en: 'Movies', es: 'Películas', zh: '电影', ja: '映画' },
  { id: 'travel', emoji: '✈️', en: 'Travel', es: 'Viajes', zh: '旅行', ja: '旅行' },
  { id: 'food', emoji: '🍔', en: 'Food', es: 'Comida', zh: '美食', ja: '食べ物' },
  { id: 'reading', emoji: '📚', en: 'Reading', es: 'Lectura', zh: '阅读', ja: '読書' },
  { id: 'gaming', emoji: '🎮', en: 'Gaming', es: 'Videojuegos', zh: '游戏', ja: 'ゲーム' },
  { id: 'art', emoji: '🎨', en: 'Art', es: 'Arte', zh: '艺术', ja: 'アート' },
  { id: 'technology', emoji: '💻', en: 'Technology', es: 'Tecnología', zh: '科技', ja: 'テクノロジー' },
  { id: 'fitness', emoji: '💪', en: 'Fitness', es: 'Fitness', zh: '健身', ja: 'フィットネス' },
];

const LANGUAGE_LEVELS = [
  { id: 'beginner', en: 'Beginner', es: 'Principiante', zh: '初级', ja: '初級' },
  { id: 'intermediate', en: 'Intermediate', es: 'Intermedio', zh: '中级', ja: '中級' },
  { id: 'advanced', en: 'Advanced', es: 'Avanzado', zh: '高级', ja: '上級' },
  { id: 'native', en: 'Native', es: 'Nativo', zh: '母语', ja: 'ネイティブ' },
];

export default function EditProfileScreen({ navigation }) {
  const { user, userProfile } = useAuth();
  const [interests, setInterests] = useState([]);
  const [languageLevel, setLanguageLevel] = useState('intermediate');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const language = userProfile?.language || 'en';

  const getTranslation = (key) => {
    const translations = {
      editProfile: {
        en: 'Edit Profile',
        es: 'Editar Perfil',
        zh: '编辑资料',
        ja: 'プロフィール編集'
      },
      interests: {
        en: 'Interests',
        es: 'Intereses',
        zh: '兴趣',
        ja: '興味'
      },
      selectInterests: {
        en: 'Select your interests (up to 5)',
        es: 'Selecciona tus intereses (hasta 5)',
        zh: '选择您的兴趣（最多5个）',
        ja: '興味を選択（最大5つ）'
      },
      languageLevel: {
        en: 'Language Level',
        es: 'Nivel de Idioma',
        zh: '语言水平',
        ja: '言語レベル'
      },
      bio: {
        en: 'Bio',
        es: 'Biografía',
        zh: '简介',
        ja: '自己紹介'
      },
      bioPlaceholder: {
        en: 'Tell others about yourself...',
        es: 'Cuéntales a otros sobre ti...',
        zh: '介绍一下自己...',
        ja: '自己紹介を書いてください...'
      },
      save: {
        en: 'Save',
        es: 'Guardar',
        zh: '保存',
        ja: '保存'
      },
      saved: {
        en: 'Profile Updated',
        es: 'Perfil Actualizado',
        zh: '资料已更新',
        ja: 'プロフィール更新完了'
      },
      profileUpdated: {
        en: 'Your profile has been updated successfully!',
        es: '¡Tu perfil se ha actualizado correctamente!',
        zh: '您的资料已成功更新！',
        ja: 'プロフィールが正常に更新されました！'
      },
    };
    return translations[key]?.[language] || translations[key]?.en || key;
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setInterests(data.interests || []);
        setLanguageLevel(data.languageLevel || 'intermediate');
        setBio(data.bio || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interestId) => {
    if (interests.includes(interestId)) {
      setInterests(interests.filter(id => id !== interestId));
    } else {
      if (interests.length < 5) {
        setInterests([...interests, interestId]);
      } else {
        const title = language === 'en' ? 'Limit Reached' : language === 'es' ? 'Límite Alcanzado' : language === 'zh' ? '已达上限' : '上限に達しました';
        const message = language === 'en' 
          ? 'You can select up to 5 interests.'
          : language === 'es'
          ? 'Puedes seleccionar hasta 5 intereses.'
          : language === 'zh'
          ? '最多可选择5个兴趣。'
          : '最大5つまで選択できます。';
        
        if (Platform.OS === 'web') {
          window.alert(`${title}\n\n${message}`);
        } else {
          Alert.alert(title, message);
        }
      }
    }
  };

  const calculateProfileCompletion = () => {
    let score = 0;
    if (userProfile?.displayName) score += 25;
    if (interests.length > 0) score += 25;
    if (languageLevel) score += 25;
    if (bio && bio.length > 10) score += 25;
    return score;
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    
    try {
      setSaving(true);
      const profileCompletion = calculateProfileCompletion();
      
      await updateDoc(doc(db, 'users', user.uid), {
        interests,
        languageLevel,
        bio,
        profileCompletion,
        updatedAt: serverTimestamp(),
      });

      const title = getTranslation('saved');
      const message = getTranslation('profileUpdated');
      
      if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
      } else {
        Alert.alert(title, message);
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving profile:', error);
      const title = language === 'en' ? 'Error' : language === 'es' ? 'Error' : language === 'zh' ? '错误' : 'エラー';
      const message = language === 'en' 
        ? 'Failed to update profile. Please try again.'
        : language === 'es'
        ? 'Error al actualizar perfil. Por favor intente nuevamente.'
        : language === 'zh'
        ? '更新资料失败。请重试。'
        : 'プロフィールの更新に失敗しました。もう一度お試しください。';
      
      if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
      } else {
        Alert.alert(title, message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>
          {language === 'en' ? 'Loading...' : language === 'es' ? 'Cargando...' : language === 'zh' ? '加载中...' : '読み込み中...'}
        </Text>
      </View>
    );
  }

  const profileCompletion = calculateProfileCompletion();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {language === 'en' ? 'Back' : language === 'es' ? 'Volver' : language === 'zh' ? '返回' : '戻る'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTranslation('editProfile')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Profile Completion */}
      <View style={styles.completionSection}>
        <Text style={styles.completionLabel}>
          {language === 'en' ? 'Profile Completion' : language === 'es' ? 'Completitud del Perfil' : language === 'zh' ? '资料完整度' : 'プロフィール完成度'}
        </Text>
        <View style={styles.completionBar}>
          <View style={[styles.completionFill, { width: `${profileCompletion}%` }]} />
        </View>
        <Text style={styles.completionText}>{profileCompletion}%</Text>
      </View>

      {/* Interests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{getTranslation('interests')}</Text>
        <Text style={styles.sectionSubtitle}>{getTranslation('selectInterests')}</Text>
        <View style={styles.interestsGrid}>
          {INTERESTS.map(interest => {
            const isSelected = interests.includes(interest.id);
            return (
              <TouchableOpacity
                key={interest.id}
                style={[styles.interestChip, isSelected && styles.interestChipSelected]}
                onPress={() => toggleInterest(interest.id)}
              >
                <Text style={styles.interestEmoji}>{interest.emoji}</Text>
                <Text style={[styles.interestText, isSelected && styles.interestTextSelected]}>
                  {interest[language] || interest.en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Language Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{getTranslation('languageLevel')}</Text>
        <View style={styles.levelContainer}>
          {LANGUAGE_LEVELS.map(level => (
            <TouchableOpacity
              key={level.id}
              style={[styles.levelButton, languageLevel === level.id && styles.levelButtonSelected]}
              onPress={() => setLanguageLevel(level.id)}
            >
              <Text style={[styles.levelText, languageLevel === level.id && styles.levelTextSelected]}>
                {level[language] || level.en}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bio */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{getTranslation('bio')}</Text>
        <TextInput
          style={styles.bioInput}
          placeholder={getTranslation('bioPlaceholder')}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          maxLength={200}
          placeholderTextColor="#999"
        />
        <Text style={styles.charCount}>{bio.length}/200</Text>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving 
            ? (language === 'en' ? 'Saving...' : language === 'es' ? 'Guardando...' : language === 'zh' ? '保存中...' : '保存中...')
            : getTranslation('save')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 60,
  },
  completionSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  completionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  completionBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  completionFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  completionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  interestChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  interestEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  interestText: {
    fontSize: 14,
    color: '#333',
  },
  interestTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  levelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  levelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  levelButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  levelText: {
    fontSize: 14,
    color: '#333',
  },
  levelTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  bioInput: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});





