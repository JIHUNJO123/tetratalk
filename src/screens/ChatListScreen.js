import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { collection, query, where, onSnapshot, getDoc, getDocs, updateDoc, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import AdMobBannerComponent from '../components/AdMobBanner';
import { showInterstitial } from '../components/AdMobInterstitial';

export default function ChatListScreen({ navigation }) {
  const [chatRooms, setChatRooms] = useState([]);
  const [chatClickCount, setChatClickCount] = useState(0);
  const { user, userProfile, logout, deleteAccount } = useAuth();
  const language = userProfile?.language || 'en';

  const getTranslation = (key) => {
    const translations = {
      logoutConfirmation: {
        en: 'Logout Confirmation',
        es: 'Confirmación de Cierre',
        zh: '登出确认',
        ja: 'ログアウト確認'
      },
      logoutQuestion: {
        en: 'Are you sure you want to logout?',
        es: '¿Está seguro de que desea cerrar sesión?',
        zh: '您确定要登出吗？',
        ja: '本当にログアウトしますか？'
      },
      logout: {
        en: 'Logout',
        es: 'Salir',
        zh: '登出',
        ja: 'ログアウト'
      },
      logoutFailed: {
        en: 'Logout Failed',
        es: 'Error al Cerrar',
        zh: '登出失败',
        ja: 'ログアウト失敗'
      },
      logoutError: {
        en: 'An error occurred during logout.',
        es: 'Ocurrió un error al cerrar sesión.',
        zh: '登出期间发生错误。',
        ja: 'ログアウト中にエラーが発生しました。'
      },
      cancel: {
        en: 'Cancel',
        es: 'Cancelar',
        zh: '取消',
        ja: 'キャンセル'
      },
      accountDeletionWarning: {
        en: 'Account Deletion Warning',
        es: 'Advertencia de Eliminación',
        zh: '删除账户警告',
        ja: '会員退会警告'
      },
      deleteWarningMessage: {
        en: 'All data will be permanently deleted:\n- Chat history\n- User information\n- All messages\n\nAre you sure you want to delete your account?',
        es: 'Todos los datos se eliminarán permanentemente:\n- Historial de chat\n- Información de usuario\n- Todos los mensajes\n\n¿Está seguro de que desea eliminar su cuenta?',
        zh: '所有数据将永久删除：\n- 聊天记录\n- 用户信息\n- 所有消息\n\n您确定要删除您的账户吗？',
        ja: '会員退会時、すべてのデータが永久に削除されます。\n- チャット履歴\n- ユーザー情報\n- すべてのメッセージ\n\n本当に退会しますか？'
      },
      deleteAccount: {
        en: 'Delete Account',
        es: 'Eliminar Cuenta',
        zh: '删除账户',
        ja: '会員退会'
      },
      delete: {
        en: 'Delete',
        es: 'Eliminar',
        zh: '删除',
        ja: '退会'
      },
      accountDeleted: {
        en: 'Account Deleted',
        es: 'Cuenta Eliminada',
        zh: '账户已删除',
        ja: '退会完了'
      },
      accountDeletedMessage: {
        en: 'Your account has been deleted.',
        es: 'Su cuenta ha sido eliminada.',
        zh: '您的账户已删除。',
        ja: '会員退会が完了しました。'
      },
      deletionFailed: {
        en: 'Deletion Failed',
        es: 'Error al Eliminar',
        zh: '删除失败',
        ja: '退会失敗'
      },
      error: {
        en: 'Error',
        es: 'Error',
        zh: '错误',
        ja: 'エラー'
      },
      requestAccepted: {
        en: 'Request Accepted',
        es: 'Solicitud Aceptada',
        zh: '请求已接受',
        ja: '承認完了'
      },
      chatRoomActive: {
        en: 'Chat room is now active!\nYou can start chatting now.',
        es: '¡La sala de chat está activa!\nPuede comenzar a chatear ahora.',
        zh: '聊天室现已激活！\n您现在可以开始聊天。',
        ja: 'チャットルームが有効になりました！\n会話を始められます。'
      },
      rejectChat: {
        en: 'Reject Chat',
        es: 'Rechazar Chat',
        zh: '拒绝聊天',
        ja: 'チャット拒否'
      },
      rejectQuestion: {
        en: 'Do you want to reject this request?\n(Cannot be undone)',
        es: '¿Desea rechazar esta solicitud?\n(No se puede deshacer)',
        zh: '您要拒绝此请求吗？\n（无法撤消）',
        ja: 'このリクエストを拒否しますか？\n（復元できません）'
      },
      requestRejected: {
        en: 'Request Rejected',
        es: 'Solicitud Rechazada',
        zh: '请求已拒绝',
        ja: '拒否完了'
      },
      requestRejectedMessage: {
        en: 'Chat request has been rejected.',
        es: 'La solicitud de chat ha sido rechazada.',
        zh: '聊天请求已被拒绝。',
        ja: 'チャットリクエストを拒否しました。'
      },
      rejectionFailed: {
        en: 'Rejection Failed',
        es: 'Error al Rechazar',
        zh: '拒绝失败',
        ja: '拒否失敗'
      },
      user: {
        en: 'User',
        es: 'Usuario',
        zh: '用户',
        ja: 'ユーザー'
      },
      waiting: {
        en: 'Waiting',
        es: 'Esperando',
        zh: '等待中',
        ja: '待機中'
      },
      newRequest: {
        en: 'New Request',
        es: 'Nueva Solicitud',
        zh: '新请求',
        ja: '新規リクエスト'
      },
      chatRequestSent: {
        en: 'Chat request sent',
        es: 'Solicitud de chat enviada',
        zh: '已发送聊天请求',
        ja: 'チャットリクエストを送信しました'
      },
      chatRequestReceived: {
        en: 'Chat request received',
        es: 'Solicitud de chat recibida',
        zh: '收到聊天请求',
        ja: 'チャットリクエストが届きました'
      },
      noMessages: {
        en: 'No messages',
        es: 'Sin mensajes',
        zh: '无消息',
        ja: 'メッセージがありません'
      },
      accept: {
        en: 'Accept',
        es: 'Aceptar',
        zh: '接受',
        ja: '承認'
      },
      reject: {
        en: 'Reject',
        es: 'Rechazar',
        zh: '拒绝',
        ja: '拒否'
      },
      chat: {
        en: 'Chat',
        es: 'Chat',
        zh: '聊天',
        ja: 'チャット'
      },
      startNewChat: {
        en: '+ Start New Chat',
        es: '+ Iniciar Nuevo Chat',
        zh: '+ 开始新聊天',
        ja: '+ 新しいチャットを始める'
      },
      noChatRooms: {
        en: 'No chat rooms',
        es: 'No hay salas de chat',
        zh: '没有聊天室',
        ja: 'チャットルームがありません'
      },
      settings: {
        en: 'Settings',
        es: 'Ajustes',
        zh: '设置',
        ja: '設定'
      }
    };
    return translations[key]?.[language] || translations[key]?.en || '';
  };

  const getLanguageFlag = (lang) => {
    const flags = { en: 'EN', es: 'ES', zh: '中', ja: 'JA' };
    return flags[lang] || '?';
  };

  useEffect(() => {
    if (!user || !user.uid) {
      setChatRooms([]);
      return;
    }

    console.log('Setting up ChatList listener for user:', user.uid);

    // 사용자가 참여한 채팅방 가져오기 (orderBy 제거하여 인덱스 문제 방지)
    const q = query(
      collection(db, 'chatRooms'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('ChatList snapshot updated, docs count:', snapshot.docs.length);
      const rooms = [];
      
      // 차단한 사용자 목록 가져오기
      const blockedUsersQuery = query(collection(db, 'users', user.uid, 'blocked'));
      const blockedSnapshot = await getDocs(blockedUsersQuery);
      const blockedUserIds = blockedSnapshot.docs.map(doc => doc.data().blockedUserId);
      
      for (const docSnap of snapshot.docs) {
        const roomData = docSnap.data();
        console.log('Room:', docSnap.id, 'Status:', roomData.status, 'RequestedBy:', roomData.requestedBy);
        
        // 거절된 채팅방은 목록에서 제외
        if (roomData.status === 'rejected') {
          console.log('Skipping rejected room:', docSnap.id);
          continue;
        }
        
        // 상대방 정보 가져오기
        const otherUserId = roomData.participants.find(id => id !== user.uid);
        if (otherUserId) {
          // 차단한 사용자와의 채팅방은 목록에서 제외
          if (blockedUserIds.includes(otherUserId)) {
            console.log('Skipping blocked user:', otherUserId);
            continue;
          }
          
          try {
            const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
            if (!otherUserDoc.exists()) {
              console.log('Skipping room - user does not exist:', otherUserId);
              continue;
            }
            
            const otherUser = otherUserDoc.data();
            
            // 탈퇴한 사용자와의 채팅방은 목록에서 제외
            if (otherUser.deleted) {
              console.log('Skipping room - user is deleted:', otherUser.displayName);
              continue;
            }
            
            // 읽지 않은 메시지 개수 계산
            const unreadCount = roomData[`unread_${user.uid}`] || 0;
            
            rooms.push({
              id: docSnap.id,
              ...roomData,
              otherUser,
              unreadCount,
            });
          } catch (error) {
            console.error('Error fetching other user:', otherUserId, error);
          }
        }
      }
      
      // lastMessageAt 기준으로 정렬
      rooms.sort((a, b) => {
        const aTime = a.lastMessageAt?.toDate?.() || new Date(a.lastMessageAt || 0);
        const bTime = b.lastMessageAt?.toDate?.() || new Date(b.lastMessageAt || 0);
        return bTime - aTime;
      });
      
      console.log('Setting chat rooms:', rooms.length, 'rooms');
      setChatRooms(rooms);
    }, (error) => {
      console.error('ChatList snapshot error:', error);
      console.error('Error details:', error.message, error.code);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    // 웹에서는 window.confirm 사용
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmMessage = `🚪 ${getTranslation('logoutConfirmation')}\n\n${getTranslation('logoutQuestion')}`;
      if (window.confirm(confirmMessage)) {
        try {
          console.log('Logging out...');
          await logout();
          console.log('Logout successful');
        } catch (error) {
          console.error('Logout error:', error);
          window.alert(`❌ ${getTranslation('logoutFailed')}\n\n${getTranslation('logoutError')}`);
        }
      }
    } else {
      // 모바일에서는 Alert 사용
      Alert.alert(
        getTranslation('logout'),
        getTranslation('logoutQuestion'),
        [
          { text: getTranslation('cancel'), style: 'cancel' },
          {
            text: getTranslation('logout'),
            style: 'destructive',
            onPress: async () => {
              try {
                await showInterstitial();
                await logout();
              } catch (error) {
                Alert.alert(
                  getTranslation('error'),
                  getTranslation('logoutError')
                );
              }
            },
          },
        ]
      );
    }
  };

  const handleDeleteAccount = async () => {
    console.log('handleDeleteAccount called');
    
    // 웹에서는 window.confirm 사용
    if (typeof window !== 'undefined' && window.confirm) {
      console.log('Using window.confirm for web');
      const confirmMessage = `⚠️ ${getTranslation('accountDeletionWarning')}\n\n${getTranslation('deleteWarningMessage')}`;
      if (window.confirm(confirmMessage)) {
        try {
          console.log('Calling deleteAccount...');
          await deleteAccount();
          window.alert(`✅ ${getTranslation('accountDeleted')}\n\n${getTranslation('accountDeletedMessage')}`);
        } catch (error) {
          console.error('Delete account error:', error);
          window.alert(`❌ ${getTranslation('deletionFailed')}\n\n${error.message}`);
        }
      }
    } else {
      // 모바일에서는 Alert 사용
      console.log('Using Alert for mobile');
      Alert.alert(
        getTranslation('deleteAccount'),
        getTranslation('deleteWarningMessage'),
        [
          { text: getTranslation('cancel'), style: 'cancel' },
          {
            text: getTranslation('delete'),
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('Calling deleteAccount...');
                await deleteAccount();
                Alert.alert(
                  getTranslation('accountDeleted'),
                  getTranslation('accountDeletedMessage')
                );
              } catch (error) {
                console.error('Delete account error:', error);
                Alert.alert(
                  getTranslation('error'),
                  error.message
                );
              }
            },
          },
        ]
      );
    }
  };

  const handleAcceptRequest = async (chatRoomId, otherUser) => {
    try {
      console.log('Accepting request:', chatRoomId);
      await updateDoc(doc(db, 'chatRooms', chatRoomId), {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
      });
      console.log('Chat request accepted');
      
      // 전면 광고 표시
      await showInterstitial();
      
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`✅ ${getTranslation('requestAccepted')}\n\n${getTranslation('chatRoomActive')}`);
      }
      // 승낙 후 채팅방으로 이동
      navigation.navigate('Chat', {
        chatRoomId: chatRoomId,
        otherUser: otherUser,
      });
    } catch (error) {
      console.error('Error accepting request:', error);
      console.error('Error details:', error.message);
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`❌ ${getTranslation('error')}\n\n${error.message}`);
      }
    }
  };

  const handleRejectRequest = async (chatRoomId) => {
    const confirmMessage = getTranslation('rejectQuestion');
    
    if (typeof window !== 'undefined' && window.confirm) {
      // 웹에서는 window.confirm 사용
      if (window.confirm(`⚠️ ${getTranslation('rejectChat')}\n\n${confirmMessage}`)) {
        await processReject(chatRoomId);
      }
    } else {
      // 모바일에서는 Alert.alert 사용
      Alert.alert(
        getTranslation('rejectChat'),
        confirmMessage,
        [
          { text: getTranslation('cancel'), style: 'cancel' },
          {
            text: getTranslation('reject'),
            style: 'destructive',
            onPress: () => processReject(chatRoomId),
          },
        ]
      );
    }
  };

  const processReject = async (chatRoomId) => {
    try {
      console.log('Rejecting request:', chatRoomId);
      await updateDoc(doc(db, 'chatRooms', chatRoomId), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
      });
      console.log('Chat request rejected');
      
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`✅ ${getTranslation('requestRejected')}\n\n${getTranslation('requestRejectedMessage')}`);
      } else {
        Alert.alert(
          getTranslation('requestRejected'),
          getTranslation('requestRejectedMessage')
        );
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      console.error('Error details:', error.message);
      
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`❌ ${getTranslation('rejectionFailed')}\n\n${error.message}`);
      } else {
        Alert.alert(
          getTranslation('rejectionFailed'),
          error.message
        );
      }
    }
  };

  const renderChatRoom = ({ item }) => {
    if (!user || !user.uid) return null;
    
    const languageFlag = getLanguageFlag(item.otherUser?.language);
    const isPending = item.status === 'pending';
    const isRequester = item.requestedBy === user.uid;
    const isRecipient = !isRequester && isPending;
    
    console.log('Rendering room:', item.id, '| Status:', item.status, '| isPending:', isPending, '| isRecipient:', isRecipient);
    
    return (
      <View style={styles.chatRoomItem}>
        <TouchableOpacity
          style={styles.chatRoomContent}
          onPress={async () => {
            console.log('Room clicked:', item.id, 'Status:', item.status);
            if (item.status === 'accepted') {
              // 3번째마다 전면 광고 표시
              const newCount = chatClickCount + 1;
              setChatClickCount(newCount);
              
              if (newCount % 3 === 0) {
                await showInterstitial();
              }
              
              navigation.navigate('Chat', { 
                chatRoomId: item.id,
                otherUser: item.otherUser,
              });
            } else {
              console.log('Room not accepted yet, status:', item.status);
            }
          }}
          disabled={item.status !== 'accepted'}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{languageFlag}</Text>
          </View>
          
          <View style={styles.chatRoomInfo}>
            <View style={styles.chatRoomHeader}>
              <Text style={styles.chatRoomName}>
                {item.otherUser?.displayName || getTranslation('user')}
              </Text>
              {item.unreadCount > 0 && item.status === 'accepted' && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>N</Text>
                </View>
              )}
              {isPending && isRequester && (
                <Text style={styles.pendingBadge}>
                  {getTranslation('waiting')}
                </Text>
              )}
            </View>
            
            <Text style={styles.lastMessage} numberOfLines={1}>
              {isPending 
                ? (isRequester 
                    ? getTranslation('chatRequestSent')
                    : getTranslation('chatRequestReceived')
                  )
                : (item.lastMessage || getTranslation('noMessages'))
              }
            </Text>
          </View>
        </TouchableOpacity>
        
        {isRecipient && (
          <View style={styles.requestButtons}>
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={() => handleAcceptRequest(item.id, item.otherUser)}
            >
              <Text style={styles.acceptButtonText}>
                {getTranslation('accept')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.rejectButton}
              onPress={() => handleRejectRequest(item.id)}
            >
              <Text style={styles.rejectButtonText}>
                {getTranslation('reject')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const lang = userProfile?.language || 'en';
    
    const timeTexts = {
      justNow: { en: 'Just now', es: 'Ahora', zh: '刚刚', ja: 'たった今' },
      minutesAgo: { en: 'm ago', es: 'm', zh: '分钟前', ja: '分前' },
      hoursAgo: { en: 'h ago', es: 'h', zh: '小时前', ja: '時間前' }
    };
    
    if (diff < 60000) return timeTexts.justNow[lang] || timeTexts.justNow.en;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}${timeTexts.minutesAgo[lang] || timeTexts.minutesAgo.en}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}${timeTexts.hoursAgo[lang] || timeTexts.hoursAgo.en}`;
    
    const locales = { en: 'en-US', es: 'es-ES', zh: 'zh-CN', ja: 'ja-JP' };
    return date.toLocaleDateString(locales[lang] || 'en-US');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {getTranslation('chat')}
        </Text>
        <View style={styles.headerRight}>
          <Text style={styles.userInfo}>
            {userProfile?.displayName} {getLanguageFlag(userProfile?.language)}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.settingsButton}>
            <Text style={styles.settingsText}>
              {getTranslation('settings')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteButton}>
            <Text style={styles.deleteText}>
              {getTranslation('delete')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>
              {getTranslation('logout')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => navigation.navigate('UserList')}
      >
        <Text style={styles.newChatButtonText}>
          {getTranslation('startNewChat')}
        </Text>
      </TouchableOpacity>

      {chatRooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {getTranslation('noChatRooms')}
          </Text>
          <Text style={styles.emptySubtext}>
            {getTranslation('startNewChat')}
          </Text>
        </View>
      ) : (
        <View style={{flex: 1}}>
          <FlatList
            data={chatRooms}
            renderItem={renderChatRoom}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
          <AdMobBannerComponent screenType="chatList" userId={user?.uid} />
        </View>
      )}
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  settingsButton: {
    padding: 5,
  },
  settingsText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileButton: {
    padding: 5,
  },
  profileText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 5,
  },
  deleteText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 5,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 14,
  },
  newChatButton: {
    backgroundColor: '#667eea',
    margin: 15,
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 0,
  },
  chatRoomItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  chatRoomContent: {
    flexDirection: 'row',
    flex: 1,
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
  chatRoomInfo: {
    flex: 1,
  },
  chatRoomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  chatRoomName: {
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
    maxWidth: 150,
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pendingBadge: {
    backgroundColor: '#FF9500',
    color: '#fff',
    fontSize: 9,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  chatRoomTime: {
    fontSize: 12,
    color: '#999',
  },
  lastMessage: {
    fontSize: 12,
    color: '#666',
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
});
