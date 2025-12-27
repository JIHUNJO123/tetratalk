import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  getUserMissions,
  updateMissionProgress,
  claimMissionReward,
  getUserStats,
  MISSION_TYPES,
  MISSION_TARGETS,
  MISSION_REWARDS,
} from '../services/userEngagement';

export default function MissionsScreen({ navigation }) {
  const { user, userProfile } = useAuth();
  const [missions, setMissions] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const language = userProfile?.language || 'en';

  const getTranslation = (key) => {
    const translations = {
      dailyMissions: {
        en: 'Daily Missions',
        es: 'Misiones Diarias',
        zh: '每日任务',
        ja: 'デイリーミッション'
      },
      loginStreak: {
        en: 'Login Streak',
        es: 'Racha de Inicio de Sesión',
        zh: '登录连续天数',
        ja: 'ログインストリーク'
      },
      sendMessages: {
        en: 'Send Messages',
        es: 'Enviar Mensajes',
        zh: '发送消息',
        ja: 'メッセージを送信'
      },
      startChats: {
        en: 'Start Chats',
        es: 'Iniciar Chats',
        zh: '开始聊天',
        ja: 'チャットを開始'
      },
      inviteFriends: {
        en: 'Invite Friends',
        es: 'Invitar Amigos',
        zh: '邀请朋友',
        ja: '友達を招待'
      },
      points: {
        en: 'Points',
        es: 'Puntos',
        zh: '积分',
        ja: 'ポイント'
      },
      claim: {
        en: 'Claim',
        es: 'Reclamar',
        zh: '领取',
        ja: '受け取る'
      },
      claimed: {
        en: 'Claimed',
        es: 'Reclamado',
        zh: '已领取',
        ja: '受け取り済み'
      },
      completed: {
        en: 'Completed',
        es: 'Completado',
        zh: '已完成',
        ja: '完了'
      },
      progress: {
        en: 'Progress',
        es: 'Progreso',
        zh: '进度',
        ja: '進捗'
      },
      yourStats: {
        en: 'Your Stats',
        es: 'Tus Estadísticas',
        zh: '您的统计',
        ja: 'あなたの統計'
      },
      totalPoints: {
        en: 'Total Points',
        es: 'Puntos Totales',
        zh: '总积分',
        ja: '総ポイント'
      },
      currentStreak: {
        en: 'Current Streak',
        es: 'Racha Actual',
        zh: '当前连续天数',
        ja: '現在のストリーク'
      },
      longestStreak: {
        en: 'Longest Streak',
        es: 'Racha Más Larga',
        zh: '最长连续天数',
        ja: '最長ストリーク'
      },
      badges: {
        en: 'Badges',
        es: 'Insignias',
        zh: '徽章',
        ja: 'バッジ'
      },
    };
    return translations[key]?.[language] || translations[key]?.en || key;
  };

  useEffect(() => {
    loadMissions();
    loadStats();
  }, [user]);

  const loadMissions = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const missionData = await getUserMissions(user.uid);
      setMissions(missionData);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.uid) return;
    
    try {
      const statsData = await getUserStats(user.uid);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleClaimReward = async (missionType) => {
    if (!user?.uid) return;
    
    try {
      const result = await claimMissionReward(user.uid, missionType);
      
      if (result.success) {
        const title = language === 'en' ? 'Reward Claimed!' : language === 'es' ? '¡Recompensa Reclamada!' : language === 'zh' ? '奖励已领取！' : '報酬を受け取りました！';
        const message = language === 'en'
          ? `You earned ${result.reward.points} points!`
          : language === 'es'
          ? `¡Ganaste ${result.reward.points} puntos!`
          : language === 'zh'
          ? `您获得了 ${result.reward.points} 积分！`
          : `${result.reward.points}ポイントを獲得しました！`;
        
        if (Platform.OS === 'web') {
          window.alert(`${title}\n\n${message}`);
        } else {
          Alert.alert(title, message);
        }
        
        await loadMissions();
        await loadStats();
      } else {
        const title = language === 'en' ? 'Error' : language === 'es' ? 'Error' : language === 'zh' ? '错误' : 'エラー';
        if (Platform.OS === 'web') {
          window.alert(`${title}\n\n${result.message}`);
        } else {
          Alert.alert(title, result.message);
        }
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  };

  const getMissionName = (type) => {
    const names = {
      [MISSION_TYPES.SEND_MESSAGES]: getTranslation('sendMessages'),
      [MISSION_TYPES.START_CHATS]: getTranslation('startChats'),
      [MISSION_TYPES.LOGIN_STREAK]: getTranslation('loginStreak'),
      [MISSION_TYPES.INVITE_FRIENDS]: getTranslation('inviteFriends'),
    };
    return names[type] || type;
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

  return (
    <ScrollView style={styles.container}>
      {/* Stats Section */}
      {stats && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>{getTranslation('yourStats')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.points || 0}</Text>
              <Text style={styles.statLabel}>{getTranslation('totalPoints')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.loginStreak || 0}</Text>
              <Text style={styles.statLabel}>{getTranslation('currentStreak')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.longestStreak || 0}</Text>
              <Text style={styles.statLabel}>{getTranslation('longestStreak')}</Text>
            </View>
          </View>
          
          {stats.badges && stats.badges.length > 0 && (
            <View style={styles.badgesSection}>
              <Text style={styles.badgesTitle}>{getTranslation('badges')}</Text>
              <View style={styles.badgesContainer}>
                {stats.badges.map((badge, index) => (
                  <View key={index} style={styles.badge}>
                    <Text style={styles.badgeText}>🏆 {badge}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Missions Section */}
      <View style={styles.missionsSection}>
        <Text style={styles.sectionTitle}>{getTranslation('dailyMissions')}</Text>
        
        {missions && Object.entries(missions.missions || {}).map(([type, mission]) => {
          const progress = mission.progress || 0;
          const target = MISSION_TARGETS[type];
          const completed = mission.completed || false;
          const rewardClaimed = mission.rewardClaimed || false;
          const reward = MISSION_REWARDS[type];
          const progressPercent = Math.min((progress / target) * 100, 100);

          return (
            <View key={type} style={styles.missionCard}>
              <View style={styles.missionHeader}>
                <Text style={styles.missionName}>{getMissionName(type)}</Text>
                <Text style={styles.missionReward}>+{reward.points} {getTranslation('points')}</Text>
              </View>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {progress} / {target}
                </Text>
              </View>
              
              {completed && (
                <TouchableOpacity
                  style={[styles.claimButton, rewardClaimed && styles.claimButtonDisabled]}
                  onPress={() => !rewardClaimed && handleClaimReward(type)}
                  disabled={rewardClaimed}
                >
                  <Text style={styles.claimButtonText}>
                    {rewardClaimed ? getTranslation('claimed') : getTranslation('claim')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
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
  statsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  badgesSection: {
    marginTop: 10,
  },
  badgesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#FFD700',
    padding: 8,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  missionsSection: {
    padding: 20,
  },
  missionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  missionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  missionReward: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  claimButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  claimButtonDisabled: {
    backgroundColor: '#ccc',
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});





