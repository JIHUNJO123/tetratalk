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
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
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
      
      // 각 사용자의 deleted 상태 로그
      allUsers.forEach(u => {
        console.log(`User: ${u.displayName}, deleted: ${u.deleted}, type: ${typeof u.deleted}, language: ${u.language}`);
      });
      
      const userList = allUsers
        .filter(u => {
          const shouldShow = u.id !== user.uid && 
                            u.language !== myLanguage && 
                            !u.deleted && 
                            !blockedUserIds.includes(u.id); // 차단된 사용자 제외
          
          if (u.displayName === 'jojojo') {
            console.log(`jojojo filter result: shouldShow=${shouldShow}, deleted=${u.deleted}`);
          }
          
          return shouldShow;
        })
        .sort((a, b) => {
          // 최근 활동 순 정렬 (lastActiveAt이 최신인 사람이 위로)
          const aTime = a.lastActiveAt?.toMillis ? a.lastActiveAt.toMillis() : (a.lastActiveAt || 0);
          const bTime = b.lastActiveAt?.toMillis ? b.lastActiveAt.toMillis() : (b.lastActiveAt || 0);
          return bTime - aTime;
        });

      console.log('Filtered users count:', userList.length);
      setUsers(userList);
      setFilteredUsers(userList);
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
      const isEnglish = (userProfile?.language || 'en') === 'en';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`❌ ${isEnglish ? 'Error' : 'エラー'}\n\n${isEnglish ? 'This user has been deleted.' : '退会したユーザーです。'}`);
      }
      return;
    }
    
    const isEnglish = (userProfile?.language || 'en') === 'en';
    
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
              window.alert(`⏳ ${isEnglish ? 'Already Requested' : 'すでにリクエスト済み'}\n\n${isEnglish ? 'You have already sent a chat request to this user.\nWaiting for their response.' : 'このユーザーにすでにチャットリクエストを送信しました。\n相手の返事を待っています。'}`);
            } else {
              // 모바일에서는 Alert 사용
              Alert.alert(
                isEnglish ? 'Already Requested' : 'すでにリクエスト済み',
                isEnglish ? 'You have already sent a chat request to this user.\nWaiting for their response.' : 'このユーザーにすでにチャットリクエストを送信しました。\n相手の返事を待っています。'
              );
            }
          } else {
            // 상대방이 나에게 요청한 경우 - ChatList로 이동
            console.log('New request from them, showing alert');
            if (typeof window !== 'undefined' && window.alert) {
              window.alert(`💬 ${isEnglish ? 'New Request' : '新しいリクエスト'}\n\n${isEnglish ? 'You have a chat request from this user.\nYou can accept/reject in the chat list.' : 'このユーザーからのチャットリクエストがあります。\nチャットリストで承認/拒否できます。'}`);
            } else {
              Alert.alert(
                isEnglish ? 'New Request' : '新しいリクエスト',
                isEnglish ? 'You have a chat request from this user.\nYou can accept/reject in the chat list.' : 'このユーザーからのチャットリクエストがあります。\nチャットリストで承認/拒否できます。'
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

      {filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchText ? getTranslation('noSearchResults') : getTranslation('noUsersAvailable')}
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
    fontSize: 12,
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
