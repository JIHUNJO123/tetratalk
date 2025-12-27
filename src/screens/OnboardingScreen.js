import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function OnboardingScreen({ navigation, onComplete }) {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const pages = [
    {
      title: { en: 'Welcome to TetraTalk!', es: '¡Bienvenido a TetraTalk!', zh: '欢迎使用TetraTalk！', ja: 'TetraTalkへようこそ！' },
      description: {
        en: 'Connect with people from around the world and practice languages together.',
        es: 'Conecta con personas de todo el mundo y practica idiomas juntos.',
        zh: '与世界各地的朋友联系，一起练习语言。',
        ja: '世界中の人々とつながり、一緒に言語を練習しましょう。'
      },
      icon: '🌍',
      color: '#007AFF',
    },
    {
      title: { en: 'Real-time Translation', es: 'Traducción en Tiempo Real', zh: '实时翻译', ja: 'リアルタイム翻訳' },
      description: {
        en: 'Chat naturally in your language. Messages are automatically translated for your partner.',
        es: 'Chatea naturalmente en tu idioma. Los mensajes se traducen automáticamente para tu pareja.',
        zh: '用您的语言自然聊天。消息会自动为您的伙伴翻译。',
        ja: 'あなたの言語で自然にチャット。メッセージは自動的に相手に翻訳されます。'
      },
      icon: '💬',
      color: '#34C759',
    },
    {
      title: { en: 'Find Language Partners', es: 'Encuentra Compañeros de Idioma', zh: '寻找语言伙伴', ja: '言語パートナーを見つける' },
      description: {
        en: 'Browse users by language and start conversations with native speakers.',
        es: 'Explora usuarios por idioma e inicia conversaciones con hablantes nativos.',
        zh: '按语言浏览用户，与母语者开始对话。',
        ja: '言語別にユーザーを閲覧し、ネイティブスピーカーと会話を始めましょう。'
      },
      icon: '👥',
      color: '#FF9500',
    },
    {
      title: { en: 'Ready to Start?', es: '¿Listo para Empezar?', zh: '准备开始了吗？', ja: '始める準備はできましたか？' },
      description: {
        en: 'Join thousands of language learners and start your journey today!',
        es: '¡Únete a miles de estudiantes de idiomas y comienza tu viaje hoy!',
        zh: '加入数千名语言学习者，今天就开始您的旅程！',
        ja: '何千人もの言語学習者に参加して、今日から旅を始めましょう！'
      },
      icon: '🚀',
      color: '#AF52DE',
    },
  ];

  const language = 'en'; // TODO: Get from context
  const getText = (obj) => obj[language] || obj.en;

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      scrollViewRef.current?.scrollTo({
        x: nextPage * width,
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      if (onComplete) {
        onComplete();
      } else {
        navigation?.replace('ChatList');
      }
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      if (onComplete) {
        onComplete();
      } else {
        navigation?.replace('ChatList');
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const page = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentPage(page);
        }}
        scrollEnabled={false}
      >
        {pages.map((page, index) => (
          <View key={index} style={styles.page}>
            <View style={styles.content}>
              <Text style={[styles.icon, { color: page.color }]}>
                {page.icon}
              </Text>
              <Text style={styles.title}>{getText(page.title)}</Text>
              <Text style={styles.description}>{getText(page.description)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentPage === index && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          {currentPage < pages.length - 1 && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>
                {language === 'en' ? 'Skip' : language === 'es' ? 'Omitir' : language === 'zh' ? '跳过' : 'スキップ'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: pages[currentPage].color }]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentPage < pages.length - 1
                ? (language === 'en' ? 'Next' : language === 'es' ? 'Siguiente' : language === 'zh' ? '下一步' : '次へ')
                : (language === 'en' ? 'Get Started' : language === 'es' ? 'Comenzar' : language === 'zh' ? '开始' : '始める')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  page: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    fontSize: 80,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#007AFF',
    width: 24,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    padding: 12,
  },
  skipButtonText: {
    color: '#999',
    fontSize: 16,
  },
  nextButton: {
    flex: 1,
    marginLeft: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});





