import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

const GROUP_TOPICS = [
  { id: 'daily', emoji: '💬', en: 'Daily Conversation', es: 'Conversación Diaria', zh: '日常对话', ja: '日常会話' },
  { id: 'hobbies', emoji: '🎨', en: 'Hobbies', es: 'Pasatiempos', zh: '爱好', ja: '趣味' },
  { id: 'travel', emoji: '✈️', en: 'Travel', es: 'Viajes', zh: '旅行', ja: '旅行' },
  { id: 'food', emoji: '🍔', en: 'Food & Cooking', es: 'Comida y Cocina', zh: '美食与烹饪', ja: '料理' },
  { id: 'sports', emoji: '⚽', en: 'Sports', es: 'Deportes', zh: '运动', ja: 'スポーツ' },
  { id: 'music', emoji: '🎵', en: 'Music', es: 'Música', zh: '音乐', ja: '音楽' },
  { id: 'movies', emoji: '🎬', en: 'Movies & TV', es: 'Películas y TV', zh: '电影与电视', ja: '映画・テレビ' },
  { id: 'books', emoji: '📚', en: 'Books', es: 'Libros', zh: '书籍', ja: '本' },
];

export default function GroupChatListScreen({ navigation }) {
  const { user, userProfile } = useAuth();
  const [groups, setGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [groupName, setGroupName] = useState('');
  const language = userProfile?.language || 'en';

  const getTranslation = (key) => {
    const translations = {
      groupChats: {
        en: 'Group Chats',
        es: 'Chats Grupales',
        zh: '群组聊天',
        ja: 'グループチャット'
      },
      createGroup: {
        en: 'Create Group',
        es: 'Crear Grupo',
        zh: '创建群组',
        ja: 'グループ作成'
      },
      selectTopic: {
        en: 'Select Topic',
        es: 'Seleccionar Tema',
        zh: '选择主题',
        ja: 'トピックを選択'
      },
      groupName: {
        en: 'Group Name',
        es: 'Nombre del Grupo',
        zh: '群组名称',
        ja: 'グループ名'
      },
      create: {
        en: 'Create',
        es: 'Crear',
        zh: '创建',
        ja: '作成'
      },
      cancel: {
        en: 'Cancel',
        es: 'Cancelar',
        zh: '取消',
        ja: 'キャンセル'
      },
      members: {
        en: 'members',
        es: 'miembros',
        zh: '成员',
        ja: 'メンバー'
      },
      noGroups: {
        en: 'No groups yet. Create one to start chatting!',
        es: 'Aún no hay grupos. ¡Crea uno para comenzar a chatear!',
        zh: '还没有群组。创建一个开始聊天吧！',
        ja: 'グループがありません。作成してチャットを始めましょう！'
      },
    };
    return translations[key]?.[language] || translations[key]?.en || key;
  };

  useEffect(() => {
    const groupsRef = collection(db, 'groupChats');
    const q = query(groupsRef, orderBy('lastMessageAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGroups(groupsList);
    });

    return () => unsubscribe();
  }, []);

  const createGroup = async () => {
    if (!groupName.trim() || !selectedTopic || !user) return;

    try {
      const topic = GROUP_TOPICS.find(t => t.id === selectedTopic);
      const topicName = topic?.[language] || topic?.en || selectedTopic;

      const groupData = {
        name: groupName.trim(),
        topic: selectedTopic,
        topicName,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        lastMessageAt: Timestamp.now(),
        members: [user.uid],
        memberCount: 1,
      };

      const docRef = await addDoc(collection(db, 'groupChats'), groupData);
      
      // Add welcome message
      await addDoc(collection(db, 'groupChats', docRef.id, 'messages'), {
        text: language === 'en' 
          ? `Welcome to ${groupName}! Let's start chatting.`
          : language === 'es'
          ? `¡Bienvenidos a ${groupName}! Empecemos a chatear.`
          : language === 'zh'
          ? `欢迎来到 ${groupName}！让我们开始聊天吧。`
          : `${groupName}へようこそ！チャットを始めましょう。`,
        senderId: 'system',
        senderName: 'System',
        senderLanguage: language,
        createdAt: Timestamp.now(),
      });

      setShowCreateModal(false);
      setGroupName('');
      setSelectedTopic(null);
      
      // Navigate to the new group
      navigation.navigate('GroupChat', {
        groupId: docRef.id,
        groupName: groupName.trim(),
        groupTopic: topicName,
      });
    } catch (error) {
      console.error('Error creating group:', error);
      const title = language === 'en' ? 'Error' : language === 'es' ? 'Error' : language === 'zh' ? '错误' : 'エラー';
      const message = language === 'en' 
        ? 'Failed to create group. Please try again.'
        : language === 'es'
        ? 'Error al crear grupo. Por favor intente nuevamente.'
        : language === 'zh'
        ? '创建群组失败。请重试。'
        : 'グループの作成に失敗しました。もう一度お試しください。';
      
      if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
      } else {
        Alert.alert(title, message);
      }
    }
  };

  const renderGroup = ({ item }) => {
    const topic = GROUP_TOPICS.find(t => t.id === item.topic);
    const topicEmoji = topic?.emoji || '💬';
    const topicName = topic?.[language] || topic?.en || item.topic;

    return (
      <TouchableOpacity
        style={styles.groupItem}
        onPress={() => navigation.navigate('GroupChat', {
          groupId: item.id,
          groupName: item.name,
          groupTopic: topicName,
        })}
      >
        <View style={styles.groupIcon}>
          <Text style={styles.groupEmoji}>{topicEmoji}</Text>
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupTopic}>{topicName}</Text>
          <Text style={styles.groupMeta}>
            {item.memberCount || 0} {getTranslation('members')}
          </Text>
        </View>
        {item.lastMessage && (
          <View style={styles.lastMessage}>
            <Text style={styles.lastMessageText} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getTranslation('groupChats')}</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{getTranslation('noGroups')}</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.emptyButtonText}>{getTranslation('createGroup')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{getTranslation('createGroup')}</Text>
            
            <Text style={styles.label}>{getTranslation('groupName')}</Text>
            <TextInput
              style={styles.input}
              value={groupName}
              onChangeText={setGroupName}
              placeholder={getTranslation('groupName')}
              maxLength={30}
            />

            <Text style={styles.label}>{getTranslation('selectTopic')}</Text>
            <View style={styles.topicsGrid}>
              {GROUP_TOPICS.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.topicChip,
                    selectedTopic === topic.id && styles.topicChipSelected,
                  ]}
                  onPress={() => setSelectedTopic(topic.id)}
                >
                  <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                  <Text style={[
                    styles.topicText,
                    selectedTopic === topic.id && styles.topicTextSelected,
                  ]}>
                    {topic[language] || topic.en}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setGroupName('');
                  setSelectedTopic(null);
                }}
              >
                <Text style={styles.cancelButtonText}>{getTranslation('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createGroupButton, (!groupName.trim() || !selectedTopic) && styles.buttonDisabled]}
                onPress={createGroup}
                disabled={!groupName.trim() || !selectedTopic}
              >
                <Text style={styles.createButtonTextModal}>{getTranslation('create')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 15,
  },
  groupItem: {
    flexDirection: 'row',
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
  groupIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  groupEmoji: {
    fontSize: 24,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  groupTopic: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  groupMeta: {
    fontSize: 12,
    color: '#999',
  },
  lastMessage: {
    maxWidth: 100,
  },
  lastMessageText: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  topicChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  topicEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  topicText: {
    fontSize: 14,
    color: '#333',
  },
  topicTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  createGroupButton: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonTextModal: {
    color: '#fff',
    fontWeight: '600',
  },
});

