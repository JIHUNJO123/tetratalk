import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import {
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { registerForPushNotifications } from '../services/notifications';
import { initializeIAP, disconnectIAP, setPurchaseListener, restorePurchases as restoreIAPPurchases, isIAPAvailable } from '../services/iap';
import { setGlobalAdsRemoved } from '../components/AdMobInterstitial';
import * as Application from 'expo-application';
// GoogleSignin import 제거

const AuthContext = createContext();

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adsRemoved, setAdsRemoved] = useState(false);

  // adsRemoved 상태 변경 시 전면광고 모듈에 알림
  useEffect(() => {
    setGlobalAdsRemoved(adsRemoved);
  }, [adsRemoved]);

  // IAP 초기화 및 Purchase Listener 설정
  useEffect(() => {
    let cleanupListener = null;

    const setupIAP = async () => {
      if (isIAPAvailable()) {
        await initializeIAP();
        
        // 구매 리스너 설정
        cleanupListener = setPurchaseListener(
          // 구매 성공 시
          () => {
            console.log('Purchase successful - ads removed');
            setAdsRemoved(true);
            // Firebase에 저장
            if (user?.uid) {
              updateDoc(doc(db, 'users', user.uid), {
                adsRemoved: true,
                adsRemovedAt: new Date().toISOString(),
              }).catch(console.error);
            }
          },
          // 구매 에러 시
          (errorCode) => {
            console.error('Purchase error:', errorCode);
          }
        );
      }
    };

    setupIAP();

    return () => {
      if (cleanupListener) cleanupListener();
      if (isIAPAvailable()) disconnectIAP();
    };
  }, [user]);

  // 구매 복원 핸들러
  const handleRestorePurchases = async () => {
    if (!isIAPAvailable()) return false;
    
    try {
      const restored = await restoreIAPPurchases();
      if (restored) {
        setAdsRemoved(true);
        // Firebase에 저장
        if (user?.uid) {
          await updateDoc(doc(db, 'users', user.uid), {
            adsRemoved: true,
            adsRemovedAt: new Date().toISOString(),
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Restore purchases error:', error);
      return false;
    }
  };

  useEffect(() => {
    // Google Signin 초기화 제거

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'Logged in' : 'Logged out');
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Firestore에서 사용자 프로필 가져오기 (최대 3번 재시도)
        let retries = 3;
        let profileData = null;
        
        while (retries > 0) {
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              profileData = userDoc.data();
              break;
            }
            
            // 문서가 없으면 짧은 대기 후 재시도
            if (retries > 1) {
              console.log(`Profile not found, retrying... (${retries - 1} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (error) {
            console.error('Error loading user profile:', error);
          }
          retries--;
        }
        
        if (profileData) {
          // 탈퇴한 사용자 체크
          if (profileData.deleted) {
            console.log('Deleted user tried to login, signing out...');
            await signOut(auth);
            setUser(null);
            setUserProfile(null);
            setLoading(false);
            return;
          }
          
          setUserProfile(profileData);
          // 광고 제거 상태 체크
          if (profileData.adsRemoved) {
            setAdsRemoved(true);
          } else if (isIAPAvailable()) {
            // Firebase에 없지만 기기에 구매 기록이 있는지 확인
            try {
              const restored = await restoreIAPPurchases();
              if (restored) {
                console.log('Purchase restored from device');
                setAdsRemoved(true);
                await updateDoc(doc(db, 'users', firebaseUser.uid), {
                  adsRemoved: true,
                  adsRemovedAt: new Date().toISOString(),
                }).catch(console.error);
              }
            } catch (error) {
              console.error('Error checking purchase restoration:', error);
            }
          }
          console.log('User profile loaded:', profileData);
          
          // 푸시 알림 토큰 등록 (웹에서는 제외)
          if (Platform.OS !== 'web') {
            const pushToken = await registerForPushNotifications();
            if (pushToken) {
              await updateDoc(doc(db, 'users', firebaseUser.uid), {
                pushToken: pushToken,
                lastActive: new Date().toISOString(),
              });
              console.log('푸시 토큰 저장 완료:', pushToken);
            }
          }
        } else {
          console.error('User profile not found in Firestore for UID:', firebaseUser.uid);
          // Firestore에 프로필이 없으면 기본 프로필 설정
          const defaultProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || 'Unknown',
            displayName: firebaseUser.displayName || 'Unknown',
            language: 'en',
            provider: 'email'
          };
          setUserProfile(defaultProfile);
          setLoading(false);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Firebase Auth를 사용하는 회원가입 함수
  const signup = async (email, password, displayName, language) => {
    try {
      setLoading(true);
      console.log('Starting signup process for email:', email);

      // 닉네임 중복 체크
      const displayNameQuery = query(collection(db, 'users'), where('displayName', '==', displayName));
      const displayNameSnapshot = await getDocs(displayNameQuery);
      if (!displayNameSnapshot.empty) {
        console.log('Display name already exists:', displayName);
        throw new Error(language === 'en' ? 'This nickname is already in use.' : 'このニックネームはすでに使用されています。');
      }

      // Firebase Auth로 사용자 생성 (이메일 직접 사용)
      console.log('Creating Firebase Auth user with email:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('Firebase Auth user created:', firebaseUser.uid);

      // 디바이스 ID 생성
      let deviceId;
      if (Platform.OS === 'web') {
        deviceId = 'web-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
      } else if (Platform.OS === 'android') {
        deviceId = Application.androidId || 'device-' + Date.now();
      } else if (Platform.OS === 'ios') {
        deviceId = await Application.getIosIdForVendorAsync?.() || 'device-' + Date.now();
      } else {
        deviceId = 'device-' + Date.now();
      }

      // Firestore에 사용자 프로필 저장
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        uid: firebaseUser.uid,
        email,
        displayName,
        language,
        deviceId,
        createdAt: new Date().toISOString(),
        provider: 'email',
        deleted: false
      });

      // 프로필 설정
      const profileData = {
        uid: firebaseUser.uid,
        email,
        displayName,
        language,
        deviceId,
        provider: 'email'
      };

      setUserProfile(profileData);
      setUser(firebaseUser);
      setLoading(false);

      return profileData;
    } catch (error) {
      console.error('Signup error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      setLoading(false);
      throw error;
    }
  };

  // Firebase Auth를 사용하는 로그인 함수
  const login = async (email, password, selectedLanguage = 'en') => {
    try {
      setLoading(true);
      console.log('Starting login process for email:', email);

      // Firebase Auth로 로그인 시도 (이메일 직접 사용)
      console.log('Attempting Firebase Auth login with email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('Firebase Auth login successful:', firebaseUser.uid);

      // Firestore에서 최신 프로필 데이터 가져오기
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        
        // 탈퇴한 사용자 체크
        if (profileData.deleted) {
          console.log('User is deleted:', email);
          await signOut(auth);
          throw new Error('This account has been deleted.');
        }
        
        setUserProfile(profileData);
        setUser(firebaseUser);
        setLoading(false);
        return profileData;
      } else {
        throw new Error('User profile not found.');
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // 로그아웃 전에 상태 클리어
      setUserProfile(null);
      await signOut(auth);
      // 명시적으로 user도 null로 설정
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  // 이메일 인증 관련 함수 완전 제거

  const deleteAccount = async () => {
    try {
      if (!user || !user.uid) {
        throw new Error('No user logged in');
      }

      const userId = user.uid;
      console.log('Starting account deletion for user:', userId);

      // 1. 사용자의 모든 채팅방 찾기
      const chatRoomsQuery = query(
        collection(db, 'chatRooms'),
        where('participants', 'array-contains', userId)
      );
      const chatRoomsSnapshot = await getDocs(chatRoomsQuery);

      // 2. 각 채팅방의 메시지 삭제
      for (const roomDoc of chatRoomsSnapshot.docs) {
        const messagesQuery = query(collection(db, 'chatRooms', roomDoc.id, 'messages'));
        const messagesSnapshot = await getDocs(messagesQuery);
        
        for (const msgDoc of messagesSnapshot.docs) {
          await deleteDoc(doc(db, 'chatRooms', roomDoc.id, 'messages', msgDoc.id));
        }
        
        // 3. 채팅방 삭제
        await deleteDoc(doc(db, 'chatRooms', roomDoc.id));
      }

      // 4. 사용자 프로필 삭제
      await deleteDoc(doc(db, 'users', userId));

      // 5. Firebase Auth 계정 삭제
      await user.delete();

      // 6. 로컬 상태 초기화
      setUser(null);
      setUserProfile(null);

      console.log('Account deletion completed');
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    signup,
    login,
    logout,
    deleteAccount,
    loading,
    setUserProfile,
    adsRemoved,
    handleRestorePurchases,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
