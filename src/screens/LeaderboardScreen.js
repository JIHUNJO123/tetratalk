import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

export default function LeaderboardScreen({ navigation }) {
  const { user, userProfile } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedTab, setSelectedTab] = useState('points'); // points, streak, messages
  const [loading, setLoading] = useState(true);
  const language = userProfile?.language || 'en';

  const getTranslation = (key) => {
    const translations = {
      leaderboard: {
        en: 'Leaderboard',
        es: 'Clasificación',
        zh: '排行榜',
        ja: 'リーダーボード'
      },
      points: {
        en: 'Points',
        es: 'Puntos',
        zh: '积分',
        ja: 'ポイント'
      },
      streak: {
        en: 'Streak',
        es: 'Racha',
        zh: '连续天数',
        ja: 'ストリーク'
      },
      messages: {
        en: 'Messages',
        es: 'Mensajes',
        zh: '消息',
        ja: 'メッセージ'
      },
      weekly: {
        en: 'Weekly',
        es: 'Semanal',
        zh: '每周',
        ja: '週間'
      },
      monthly: {
        en: 'Monthly',
        es: 'Mensual',
        zh: '每月',
        ja: '月間'
      },
      allTime: {
        en: 'All Time',
        es: 'Todo el Tiempo',
        zh: '全部',
        ja: '全期間'
      },
      yourRank: {
        en: 'Your Rank',
        es: 'Tu Rango',
        zh: '您的排名',
        ja: 'あなたのランク'
      },
      rank: {
        en: 'Rank',
        es: 'Rango',
        zh: '排名',
        ja: 'ランク'
      },
    };
    return translations[key]?.[language] || translations[key]?.en || key;
  };

  useEffect(() => {
    loadLeaderboard();
  }, [selectedTab]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      let q;
      
      if (selectedTab === 'points') {
        q = query(
          collection(db, 'users'),
          orderBy('points', 'desc'),
          limit(100)
        );
      } else if (selectedTab === 'streak') {
        q = query(
          collection(db, 'users'),
          orderBy('loginStreak', 'desc'),
          limit(100)
        );
      } else if (selectedTab === 'messages') {
        q = query(
          collection(db, 'users'),
          orderBy('totalMessages', 'desc'),
          limit(100)
        );
      }
      
      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .map((doc, index) => ({
          id: doc.id,
          rank: index + 1,
          ...doc.data(),
        }))
        .filter(u => !u.deleted && u.displayName);
      
      setLeaderboard(users);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserRank = () => {
    if (!user?.uid) return null;
    const userIndex = leaderboard.findIndex(u => u.id === user.uid);
    return userIndex >= 0 ? userIndex + 1 : null;
  };

  const getMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const renderUser = ({ item, index }) => {
    const isCurrentUser = item.id === user?.uid;
    const value = selectedTab === 'points' 
      ? item.points || 0
      : selectedTab === 'streak'
      ? item.loginStreak || 0
      : item.totalMessages || 0;
    
    return (
      <View style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}>
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>{getMedal(item.rank)}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, isCurrentUser && styles.currentUserName]}>
            {item.displayName} {isCurrentUser && '(You)'}
          </Text>
          <Text style={styles.userValue}>
            {value.toLocaleString()} {getTranslation(selectedTab)}
          </Text>
        </View>
        {item.badges && item.badges.length > 0 && (
          <View style={styles.badgesContainer}>
            {item.badges.slice(0, 3).map((badge, idx) => (
              <Text key={idx} style={styles.badge}>🏆</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {language === 'en' ? 'Back' : language === 'es' ? 'Volver' : language === 'zh' ? '返回' : '戻る'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTranslation('leaderboard')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'points' && styles.tabActive]}
          onPress={() => setSelectedTab('points')}
        >
          <Text style={[styles.tabText, selectedTab === 'points' && styles.tabTextActive]}>
            {getTranslation('points')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'streak' && styles.tabActive]}
          onPress={() => setSelectedTab('streak')}
        >
          <Text style={[styles.tabText, selectedTab === 'streak' && styles.tabTextActive]}>
            {getTranslation('streak')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'messages' && styles.tabActive]}
          onPress={() => setSelectedTab('messages')}
        >
          <Text style={[styles.tabText, selectedTab === 'messages' && styles.tabTextActive]}>
            {getTranslation('messages')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* User Rank */}
      {getUserRank() && (
        <View style={styles.userRankCard}>
          <Text style={styles.userRankLabel}>{getTranslation('yourRank')}</Text>
          <Text style={styles.userRankValue}>#{getUserRank()}</Text>
        </View>
      )}

      {/* Leaderboard */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {language === 'en' ? 'Loading...' : language === 'es' ? 'Cargando...' : language === 'zh' ? '加载中...' : '読み込み中...'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  userRankCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    margin: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  userRankLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 5,
  },
  userRankValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 15,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentUserItem: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  currentUserName: {
    color: '#007AFF',
  },
  userValue: {
    fontSize: 14,
    color: '#666',
  },
  badgesContainer: {
    flexDirection: 'row',
  },
  badge: {
    fontSize: 16,
    marginLeft: 5,
  },
});





