import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { autoTranslate } from '../services/translation';

export default function GroupChatScreen({ route, navigation }) {
  const { groupId, groupName, groupTopic } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [translatedMessages, setTranslatedMessages] = useState({});
  const { user, userProfile } = useAuth();
  const flatListRef = useRef(null);
  const language = userProfile?.language || 'en';

  const getTranslation = (key) => {
    const translations = {
      send: {
        en: 'Send',
        es: 'Enviar',
        zh: '发送',
        ja: '送信'
      },
      typeMessage: {
        en: 'Type a message...',
        es: 'Escribe un mensaje...',
        zh: '输入消息...',
        ja: 'メッセージを入力...'
      },
      members: {
        en: 'Members',
        es: 'Miembros',
        zh: '成员',
        ja: 'メンバー'
      },
    };
    return translations[key]?.[language] || translations[key]?.en || key;
  };

  useEffect(() => {
    if (!groupId) return;

    const messagesRef = collection(db, 'groupChats', groupId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesList);
      
      // Auto scroll to bottom
      setTimeout(() => {
        if (flatListRef.current && messagesList.length > 0) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    });

    return () => unsubscribe();
  }, [groupId]);

  const handleTranslate = async (messageId, text, sourceLang, targetLang) => {
    if (translatedMessages[messageId]) {
      // Toggle translation
      setTranslatedMessages((prev) => {
        const newState = { ...prev };
        delete newState[messageId];
        return newState;
      });
      return;
    }

    try {
      const translated = await autoTranslate(text, sourceLang, targetLang);
      setTranslatedMessages((prev) => ({
        ...prev,
        [messageId]: translated,
      }));
    } catch (error) {
      console.error('Translation error:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !groupId || !user) return;

    try {
      const messagesRef = collection(db, 'groupChats', groupId, 'messages');
      await addDoc(messagesRef, {
        text: inputText.trim(),
        senderId: user.uid,
        senderName: userProfile?.displayName || 'Anonymous',
        senderLanguage: userProfile?.language || 'en',
        createdAt: Timestamp.now(),
      });

      // Update last message time
      await updateDoc(doc(db, 'groupChats', groupId), {
        lastMessageAt: Timestamp.now(),
        lastMessage: inputText.trim(),
      });

      setInputText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }) => {
    const isOwn = item.senderId === user?.uid;
    const showTranslation = translatedMessages[item.id];
    const sourceLang = item.senderLanguage || 'en';
    const targetLang = language;

    return (
      <View style={[styles.messageContainer, isOwn && styles.ownMessage]}>
        {!isOwn && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
          {item.text}
        </Text>
        {showTranslation && (
          <Text style={styles.translatedText}>
            {showTranslation}
          </Text>
        )}
        {sourceLang !== targetLang && (
          <TouchableOpacity
            onPress={() => handleTranslate(item.id, item.text, sourceLang, targetLang)}
            style={styles.translateButton}
          >
            <Text style={styles.translateButtonText}>
              {showTranslation 
                ? (language === 'en' ? 'Show Original' : language === 'es' ? 'Mostrar Original' : language === 'zh' ? '显示原文' : '原文を表示')
                : (language === 'en' ? 'Translate' : language === 'es' ? 'Traducir' : language === 'zh' ? '翻译' : '翻訳')}
            </Text>
          </TouchableOpacity>
        )}
        <Text style={styles.timestamp}>
          {item.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{groupName}</Text>
          {groupTopic && (
            <Text style={styles.headerSubtitle}>{groupTopic}</Text>
          )}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={getTranslation('typeMessage')}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>{getTranslation('send')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 24,
    color: '#007AFF',
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  messagesList: {
    padding: 15,
  },
  messageContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: '80%',
  },
  ownMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  ownMessageText: {
    color: '#fff',
  },
  translatedText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    fontStyle: 'italic',
  },
  translateButton: {
    marginTop: 5,
  },
  translateButtonText: {
    fontSize: 12,
    color: '#007AFF',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});





