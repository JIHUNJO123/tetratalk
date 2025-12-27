import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  Share,
  Platform,
  Linking,
} from 'react-native';
import { 
  collection, 
  query, 
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

export default function UserListScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { user, userProfile } = useAuth();
  const language = userProfile?.language || 'en';

  const getTranslation = (key) => {
    const translations = {
      requestSent: {
        en: 'Request Sent',
        es: 'Solicitud Enviada',
        zh: '请求已发送',
        ja: 'リクエスト完了'
      },
      requestSentMessage: {
        en: 'Chat request sent!\nYou can start chatting once they accept.',
        es: '¡Solicitud de chat enviada!\nPuedes comenzar a chatear una vez que acepten.',
        zh: '聊天请求已发送！\n对方接受后您可以开始聊天。',
        ja: 'チャットリクエストを送信しました！\n相手が承認すると会話を始められます。'
      },
      errorOccurred: {
        en: 'Error Occurred',
        es: 'Error Ocurrido',
        zh: '发生错误',
        ja: 'エラー発生'
      },
      chatRequestSent: {
        en: 'Chat request sent!',
        es: '¡Solicitud de chat enviada!',
        zh: '聊天请求已发送！',
        ja: 'チャットリクエストを送信しました！'
      },
      errorMessage: {
        en: (msg) => `An error occurred: ${msg}`,
        es: (msg) => `Ocurrió un error: ${msg}`,
        zh: (msg) => `发生错误：${msg}`,
        ja: (msg) => `エラーが発生しました: ${msg}`
      },
      back: {
        en: '› Back',
        es: '› Volver',
        zh: '› 返回',
        ja: '› 戻る'
      },
      newChat: {
        en: 'New Chat',
        es: 'Nuevo Chat',
        zh: '新聊天',
        ja: '新しいチャット'
      },
      searchUsers: {
        en: 'Search users...',
        es: 'Buscar usuarios...',
        zh: '搜索用户...',
        ja: 'ユーザー検索...'
      },
      otherLanguageUsers: {
        en: 'Users Speaking Other Languages',
        es: 'Usuarios de Otros Idiomas',
        zh: '其他语言用户',
        ja: '他の言語のユーザー'
      },
      noSearchResults: {
        en: 'No search results',
        es: 'Sin resultados de búsqueda',
        zh: '无搜索结果',
        ja: '検索結果がありません'
      },
      noUsersAvailable: {
        en: 'No users available',
        es: 'No hay usuarios disponibles',
        zh: '没有可用用户',
        ja: 'ユーザーがいません'
      },
      waitingRoom: {
        en: 'Waiting Room',
        es: 'Sala de Espera',
        zh: '等候室',
        ja: '待合室'
      },
      waitingRoomDescription: {
        en: 'We\'re finding language partners for you. New users join every day!',
        es: 'Estamos buscando compañeros de idioma para ti. ¡Nuevos usuarios se unen todos los días!',
        zh: '我们正在为您寻找语言伙伴。每天都有新用户加入！',
        ja: '言語パートナーを探しています。毎日新しいユーザーが参加しています！'
      },
      tryBotChat: {
        en: 'Try Practice Chat',
        es: 'Probar Chat de Práctica',
        zh: '尝试练习聊天',
        ja: '練習チャットを試す'
      },
      inviteFriends: {
        en: 'Invite Friends',
        es: 'Invitar Amigos',
        zh: '邀请朋友',
        ja: '友達を招待'
      },
      shareApp: {
        en: 'Share App',
        es: 'Compartir App',
        zh: '分享应用',
        ja: 'アプリを共有'
      },
      estimatedWait: {
        en: 'Estimated wait time:',
        es: 'Tiempo de espera estimado:',
        zh: '预计等待时间：',
        ja: '予想待ち時間：'
      },
      minutes: {
        en: 'minutes',
        es: 'minutos',
        zh: '分钟',
        ja: '分'
      },
      allLanguages: {
        en: 'All Languages',
        es: 'Todos los Idiomas',
        zh: '所有语言',
        ja: '全ての言語'
      },
      startChatWith: {
        en: 'Start chat with',
        es: 'Iniciar chat con',
        zh: '开始与以下用户聊天',
        ja: 'チャットを開始'
      },
      chatConfirmMessage: {
        en: 'Do you want to start chatting with this user?',
        es: '¿Quieres iniciar un chat con este usuario?',
        zh: '您想与此用户开始聊天吗？',
        ja: 'このユーザーとチャットを開始しますか？'
      },
      yes: {
        en: 'Yes',
        es: 'Sí',
        zh: '是',
        ja: 'はい'
      },
      no: {
        en: 'No',
        es: 'No',
        zh: '否',
        ja: 'いいえ'
      },
      error: {
        en: 'Error',
        es: 'Error',
        zh: '错误',
        ja: 'エラー'
      },
      userDeleted: {
        en: 'This user has been deleted.',
        es: 'Este usuario ha sido eliminado.',
        zh: '该用户已被删除。',
        ja: '退会したユーザーです。'
      },
      alreadyRequested: {
        en: 'Already Requested',
        es: 'Ya Solicitado',
        zh: '已请求',
        ja: 'すでにリクエスト済み'
      },
      alreadyRequestedMessage: {
        en: 'You have already sent a chat request to this user.\nWaiting for their response.',
        es: 'Ya has enviado una solicitud de chat a este usuario.\nEsperando su respuesta.',
        zh: '您已向此用户发送聊天请求。\n等待对方回复。',
        ja: 'このユーザーにすでにチャットリクエストを送信しました。\n相手の返事を待っています。'
      },
      newRequest: {
        en: 'New Request',
        es: 'Nueva Solicitud',
        zh: '新请求',
        ja: '新しいリクエスト'
      },
      newRequestMessage: {
        en: 'You have a chat request from this user.\nYou can accept/reject in the chat list.',
        es: 'Tienes una solicitud de chat de este usuario.\nPuedes aceptar/rechazar en la lista de chat.',
        zh: '您收到了此用户的聊天请求。\n您可以在聊天列表中接受/拒绝。',
        ja: 'このユーザーからのチャットリクエストがあります。\nチャットリストで承認/拒否できます。'
      }
    };
    return translations[key]?.[language] || translations[key]?.en || '';
  };

  const getLanguageName = (lang) => {
    const names = {
      en: { en: 'English', es: 'Inglés', zh: '英语', ja: '英語' },
      es: { en: 'Spanish', es: 'Español', zh: '西班牙语', ja: 'スペイン語' },
      zh: { en: 'Chinese', es: 'Chino', zh: '中文', ja: '中国語' },
      ja: { en: 'Japanese', es: 'Japonés', zh: '日语', ja: '日本語' }
    };
    return names[lang]?.[language] || names[lang]?.en || lang;
  };

  const getLanguageFlag = (lang) => {
    const flags = {
      en: 'EN',
      es: 'ES',
      zh: '中',
      ja: 'JA'
    };
    return flags[lang] || '?';
  };

  useEffect(() => {
    if (user && user.uid) {
      loadUsers();
    }
  }, [user]);

  useEffect(() => {
    if (!user || !user.uid) return;

    // 실시간 사용자 목록 업데이트
    const q = query(collection(db, 'users'));
    
    const unsubscribe = onSnapshot(async (snapshot) => {
      const myLanguage = userProfile?.language || 'en';
      
      console.log('=== UserList Snapshot ===');
      console.log('Total users in DB:', snapshot.docs.length);
      
      // 차단한 사용자 목록 가져오기
      const blockedUsersQuery = query(collection(db, 'users', user.uid, 'blocked'));
      const blockedSnapshot = await getDocs(blockedUsersQuery);
      const blockedUserIds = blockedSnapshot.docs.map(doc => doc.data().blockedUserId);
      console.log('Blocked user IDs:', blockedUserIds);
      
      const allUsers = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // 기본 필터링
      const filteredUsers = allUsers.filter(u => {
        return u.id !== user.uid && 
               u.language !== myLanguage && 
               !u.deleted && 
               !blockedUserIds.includes(u.id);
      });

      // 스마트 매칭 적용
      try {
        const { getSmartMatchedUsers } = await import('../services/smartMatching');
        const smartMatched = await getSmartMatchedUsers(user.uid, userProfile, 50);
        
        // 스마트 매칭 결과와 기본 목록 병합 (중복 제거)
        const userMap = new Map();
        
        // 스마트 매칭 결과를 먼저 추가 (높은 우선순위)
        smartMatched.forEach(u => {
          if (filteredUsers.find(fu => fu.id === u.id)) {
            userMap.set(u.id, { ...u, isSmartMatched: true });
          }
        });
        
        // 나머지 사용자 추가
        filteredUsers.forEach(u => {
          if (!userMap.has(u.id)) {
            userMap.set(u.id, u);
          }
        });
        
        const userList = Array.from(userMap.values());
        console.log('Smart matched users count:', userList.length);
        setUsers(userList);
        setFilteredUsers(userList);
      } catch (error) {
        console.error('Error applying smart matching:', error);
        // 에러 시 기본 정렬 사용
        const userList = filteredUsers.sort((a, b) => {
          const aTime = a.lastActiveAt?.toMillis ? a.lastActiveAt.toMillis() : (a.lastActiveAt || 0);
          const bTime = b.lastActiveAt?.toMillis ? b.lastActiveAt.toMillis() : (b.lastActiveAt || 0);
          return bTime - aTime;
        });
        setUsers(userList);
        setFilteredUsers(userList);
      }
    }, (error) => {
      console.error('Error loading users:', error);
    });

    return () => unsubscribe();
  }, [user, userProfile?.language]);

  useEffect(() => {
    let filtered = users;
    
    // 언어 필터 적용
    if (selectedLanguage !== 'all') {
      filtered = filtered.filter(u => u.language === selectedLanguage);
    }
    
    // 검색어 필터 적용
    if (searchText.trim() !== '') {
      filtered = filtered.filter(u =>
        u.displayName.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    setFilteredUsers(filtered);
  }, [searchText, users, selectedLanguage]);

  const loadUsers = async () => {
    // 더 이상 사용하지 않음 - onSnapshot으로 대체
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowConfirmModal(true);
  };

  const handleConfirmChat = () => {
    setShowConfirmModal(false);
    if (selectedUser) {
      createChatRoom(selectedUser);
    }
  };

  const handleCancelChat = () => {
    setShowConfirmModal(false);
    setSelectedUser(null);
  };

  const handleInviteFriends = async () => {
    try {
      const inviteCode = user?.uid?.substring(0, 8).toUpperCase() || 'TETRA';
      const inviteMessage = language === 'en'
        ? `Join me on TetraTalk! Practice languages with native speakers. Use my invite code: ${inviteCode}`
        : language === 'es'
        ? `¡Únete a mí en TetraTalk! Practica idiomas con hablantes nativos. Usa mi código de invitación: ${inviteCode}`
        : language === 'zh'
        ? `和我一起加入TetraTalk！与母语者练习语言。使用我的邀请码：${inviteCode}`
        : `TetraTalkに参加しましょう！ネイティブスピーカーと言語を練習。招待コード: ${inviteCode}`;

      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'TetraTalk',
            text: inviteMessage,
            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(inviteMessage);
          Alert.alert(
            getTranslation('inviteFriends'),
            language === 'en' ? 'Invite link copied to clipboard!' : '招待リンクがクリップボードにコピーされました！'
          );
        }
      } else {
        const result = await Share.share({
          message: inviteMessage,
          title: 'TetraTalk',
        });

        if (result.action === Share.sharedAction) {
          // Track invitation in Firestore
          try {
            await addDoc(collection(db, 'invitations'), {
              inviterId: user.uid,
              inviterName: userProfile?.displayName,
              timestamp: serverTimestamp(),
              platform: Platform.OS,
            });
          } catch (error) {
            console.error('Error tracking invitation:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert(
        getTranslation('error'),
        language === 'en' ? 'Failed to share. Please try again.' : '共有に失敗しました。もう一度お試しください。'
      );
    }
  };

  const handleShareApp = async () => {
    try {
      const shareMessage = language === 'en'
        ? 'Check out TetraTalk - Practice languages with native speakers through real-time translation!'
        : language === 'es'
        ? '¡Mira TetraTalk - Practica idiomas con hablantes nativos a través de traducción en tiempo real!'
        : language === 'zh'
        ? '看看TetraTalk - 通过实时翻译与母语者练习语言！'
        : 'TetraTalkをチェック - リアルタイム翻訳でネイティブスピーカーと言語を練習！';

      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'TetraTalk',
            text: shareMessage,
            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(shareMessage);
          Alert.alert(
            getTranslation('shareApp'),
            language === 'en' ? 'Share link copied to clipboard!' : '共有リンクがクリップボードにコピーされました！'
          );
        }
      } else {
        await Share.share({
          message: shareMessage,
          title: 'TetraTalk',
        });
      }
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };

  const createChatRoom = async (otherUser) => {
    if (!user || !user.uid) {
      console.log('User not logged in');
      return;
    }
    
    // userProfile이 로드되지 않았으면 alert 후 리턴
    if (!userProfile) {
      console.log('userProfile not loaded');
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Loading user profile, please wait...');
      }
      return;
    }
    
    // 상대방이 탈퇴한 사용자인지 확인
    if (otherUser.deleted) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`❌ ${getTranslation('error')}\n\n${getTranslation('userDeleted')}`);
      } else {
        Alert.alert(getTranslation('error'), getTranslation('userDeleted'));
      }
      return;
    }
    
    try {
      // 이미 채팅방이 있는지 확인
      const q = query(
        collection(db, 'chatRooms'),
        where('participants', 'array-contains', user.uid)
      );

      const snapshot = await getDocs(q);
      let existingRoom = null;

      snapshot.forEach(doc => {
        const room = doc.data();
        if (room.participants.includes(otherUser.id)) {
          existingRoom = { id: doc.id, ...room };
        }
      });

      if (existingRoom) {
        // 기존 채팅방 상태 확인
        if (existingRoom.status === 'pending') {
          // 요청자인지 수신자인지 확인
          if (existingRoom.requestedBy === user.uid) {
            console.log('Already requested, showing alert');
            if (typeof window !== 'undefined' && window.alert) {
              window.alert(`⏳ ${getTranslation('alreadyRequested')}\n\n${getTranslation('alreadyRequestedMessage')}`);
            } else {
              // 모바일에서는 Alert 사용
              Alert.alert(
                getTranslation('alreadyRequested'),
                getTranslation('alreadyRequestedMessage')
              );
            }
          } else {
            // 상대방이 나에게 요청한 경우 - ChatList로 이동
            console.log('New request from them, showing alert');
            if (typeof window !== 'undefined' && window.alert) {
              window.alert(`💬 ${getTranslation('newRequest')}\n\n${getTranslation('newRequestMessage')}`);
            } else {
              Alert.alert(
                getTranslation('newRequest'),
                getTranslation('newRequestMessage')
              );
            }
            navigation.goBack();
          }
          return;
        } else if (existingRoom.status === 'accepted') {
          // 수락된 채팅방으로 이동
          navigation.navigate('Chat', {
            chatRoomId: existingRoom.id,
            otherUser: otherUser,
          });
          return;
        } else if (existingRoom.status === 'rejected') {
          // 거절된 채팅방 삭제하고 새로 요청 가능하게 함
          try {
            await deleteDoc(doc(db, 'chatRooms', existingRoom.id));
            console.log('Deleted rejected chat room');
            
            // 삭제 후 새로운 요청 생성
            const chatRoomRef = await addDoc(collection(db, 'chatRooms'), {
              participants: [user.uid, otherUser.id],
              participantsInfo: {
                [user.uid]: {
                  displayName: userProfile?.displayName || 'Unknown',
                  language: userProfile?.language || 'en',
                },
                [otherUser.id]: {
                  displayName: otherUser.displayName || 'Unknown',
                  language: otherUser.language || 'ja',
                },
              },
              status: 'pending',
              requestedBy: user.uid,
              requestedAt: serverTimestamp(),
              createdAt: serverTimestamp(),
              lastMessageAt: serverTimestamp(),
              lastMessage: '',
            });

            // 일일 미션 업데이트 (채팅 시작하기)
            try {
              const { updateMissionProgress, MISSION_TYPES } = await import('../services/userEngagement');
              await updateMissionProgress(user.uid, MISSION_TYPES.START_CHATS);
              
              // 사용자 통계 업데이트
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              const currentTotal = userDoc.data()?.totalChats || 0;
              await updateDoc(doc(db, 'users', user.uid), {
                totalChats: currentTotal + 1,
              });
            } catch (error) {
              console.error('Error updating mission:', error);
            }

            if (typeof window !== 'undefined' && window.alert) {
              window.alert(`✅ ${getTranslation('requestSent')}\n\n${getTranslation('requestSentMessage')}`);
            }
            navigation.goBack();
          } catch (error) {
            console.error('Error handling rejected room:', error);
            if (typeof window !== 'undefined' && window.alert) {
              window.alert(`❌ ${getTranslation('errorOccurred')}\n\n${error.message}`);
            }
          }
          return;
        }
      } else {
        // 새 채팅 요청 생성
        const chatRoomRef = await addDoc(collection(db, 'chatRooms'), {
          participants: [user.uid, otherUser.id],
          participantsInfo: {
            [user.uid]: {
              displayName: userProfile?.displayName || 'Unknown',
              language: userProfile?.language || 'en',
            },
            [otherUser.id]: {
              displayName: otherUser.displayName || 'Unknown',
              language: otherUser.language || 'ja',
            },
          },
          status: 'pending',
          requestedBy: user.uid,
          requestedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
          lastMessage: '',
        });

        // 일일 미션 업데이트 (채팅 시작하기)
        try {
          const { updateMissionProgress, MISSION_TYPES } = await import('../services/userEngagement');
          await updateMissionProgress(user.uid, MISSION_TYPES.START_CHATS);
          
          // 사용자 통계 업데이트
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const currentTotal = userDoc.data()?.totalChats || 0;
          await updateDoc(doc(db, 'users', user.uid), {
            totalChats: currentTotal + 1,
          });
        } catch (error) {
          console.error('Error updating mission:', error);
        }

        if (typeof window !== 'undefined' && window.alert) {
          window.alert(getTranslation('chatRequestSent'));
        }
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error creating chat room:', error);
      console.error('Error details:', error.message);
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(getTranslation('errorMessage')(error.message));
      }
    }
  };

  const renderUser = ({ item }) => {
    const languageFlag = getLanguageFlag(item.language);
    
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserClick(item)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{languageFlag}</Text>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.displayName}</Text>
          <Text style={styles.userLanguage}>
            {getLanguageName(item.language)}
          </Text>
        </View>
        
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{getTranslation('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTranslation('newChat')}</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={getTranslation('searchUsers')}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.languageFilterContainer}>
        <TouchableOpacity 
          style={styles.languageDropdownButton}
          onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
        >
          <Text style={styles.languageDropdownText}>
            {selectedLanguage === 'all' ? getTranslation('allLanguages') : 
             selectedLanguage === 'en' ? 'EN English' :
             selectedLanguage === 'es' ? 'ES Español' :
             selectedLanguage === 'zh' ? '中 中文' :
             'JA 日本語'}
          </Text>
          <Text style={styles.dropdownArrow}>{showLanguageDropdown ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>

      {showLanguageDropdown && (
        <View style={styles.languageDropdownMenu}>
          <TouchableOpacity
            style={[styles.languageOption, selectedLanguage === 'all' && styles.languageOptionSelected]}
            onPress={() => {
              setSelectedLanguage('all');
              setShowLanguageDropdown(false);
            }}
          >
            <Text style={styles.languageOptionText}>{getTranslation('allLanguages')}</Text>
          </TouchableOpacity>
          
          {userProfile?.language !== 'en' && (
            <TouchableOpacity
              style={[styles.languageOption, selectedLanguage === 'en' && styles.languageOptionSelected]}
              onPress={() => {
                setSelectedLanguage('en');
                setShowLanguageDropdown(false);
              }}
            >
              <Text style={styles.languageOptionText}>EN English</Text>
            </TouchableOpacity>
          )}
          
          {userProfile?.language !== 'es' && (
            <TouchableOpacity
              style={[styles.languageOption, selectedLanguage === 'es' && styles.languageOptionSelected]}
              onPress={() => {
                setSelectedLanguage('es');
                setShowLanguageDropdown(false);
              }}
            >
              <Text style={styles.languageOptionText}>ES Español</Text>
            </TouchableOpacity>
          )}
          
          {userProfile?.language !== 'zh' && (
            <TouchableOpacity
              style={[styles.languageOption, selectedLanguage === 'zh' && styles.languageOptionSelected]}
              onPress={() => {
                setSelectedLanguage('zh');
                setShowLanguageDropdown(false);
              }}
            >
              <Text style={styles.languageOptionText}>中 中文</Text>
            </TouchableOpacity>
          )}
          
          {userProfile?.language !== 'ja' && (
            <TouchableOpacity
              style={[styles.languageOption, selectedLanguage === 'ja' && styles.languageOptionSelected]}
              onPress={() => {
                setSelectedLanguage('ja');
                setShowLanguageDropdown(false);
              }}
            >
              <Text style={styles.languageOptionText}>JA 日本語</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {filteredUsers.length === 0 && !searchText ? (
        <View style={styles.waitingRoomContainer}>
          <Text style={styles.waitingRoomIcon}>⏳</Text>
          <Text style={styles.waitingRoomTitle}>
            {getTranslation('waitingRoom')}
          </Text>
          <Text style={styles.waitingRoomDescription}>
            {getTranslation('waitingRoomDescription')}
          </Text>
          
          <View style={styles.waitingRoomStats}>
            <Text style={styles.waitingRoomStatsText}>
              {getTranslation('estimatedWait')} {Math.max(5, Math.floor(users.length / 2))} {getTranslation('minutes')}
            </Text>
          </View>

          <View style={styles.waitingRoomActions}>
            <TouchableOpacity
              style={styles.waitingRoomButton}
              onPress={() => {
                // Create bot chat
                const botUser = {
                  id: 'bot-practice',
                  displayName: language === 'en' ? 'Practice Bot' : language === 'es' ? 'Bot de Práctica' : language === 'zh' ? '练习机器人' : '練習ボット',
                  language: userProfile?.language === 'en' ? 'es' : 'en',
                  isBot: true,
                };
                createChatRoom(botUser);
              }}
            >
              <Text style={styles.waitingRoomButtonText}>
                {getTranslation('tryBotChat')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.waitingRoomButton, styles.inviteButton]}
              onPress={handleInviteFriends}
            >
              <Text style={styles.waitingRoomButtonText}>
                {getTranslation('inviteFriends')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.waitingRoomButton, styles.shareButton]}
              onPress={handleShareApp}
            >
              <Text style={styles.waitingRoomButtonText}>
                {getTranslation('shareApp')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : filteredUsers.length === 0 && searchText ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {getTranslation('noSearchResults')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelChat}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>
              {getTranslation('startChatWith')}
            </Text>
            <Text style={styles.confirmUserName}>
              {selectedUser?.displayName}
            </Text>
            <Text style={styles.confirmMessage}>
              {getTranslation('chatConfirmMessage')}
            </Text>
            
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={handleCancelChat}
              >
                <Text style={styles.cancelButtonText}>
                  {getTranslation('no')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmButton, styles.yesButton]}
                onPress={handleConfirmChat}
              >
                <Text style={styles.yesButtonText}>
                  {getTranslation('yes')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5f4dee',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#5f4dee',
    borderBottomWidth: 0,
  },
  backButton: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#5f4dee',
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
  },
  listContent: {
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  userLanguage: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 24,
    color: '#ccc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  waitingRoomContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
  },
  waitingRoomIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  waitingRoomTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  waitingRoomDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  waitingRoomStats: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  waitingRoomStatsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  waitingRoomActions: {
    width: '100%',
    gap: 15,
  },
  waitingRoomButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  inviteButton: {
    backgroundColor: '#34C759',
  },
  shareButton: {
    backgroundColor: '#FF9500',
  },
  waitingRoomButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  languageFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 5,
    backgroundColor: '#5f4dee',
  },
  languageDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  languageDropdownText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  languageDropdownMenu: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageOption: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageOptionSelected: {
    backgroundColor: '#e8f4f8',
  },
  languageOptionText: {
    fontSize: 14,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmUserName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  yesButton: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  yesButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
