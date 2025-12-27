import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import {
  signOut,
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { registerForPushNotifications } from '../services/notifications';
import { initializeIAP, disconnectIAP, setPurchaseListener, restorePurchases as restoreIAPPurchases, isIAPAvailable, setRevenueCatUserId, checkPurchaseStatus } from '../services/iap';
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

  // IAP 초기화 (RevenueCat)
  useEffect(() => {
    const setupIAP = async () => {
      if (isIAPAvailable()) {
        await initializeIAP();
        
        // 사용자 로그인 시 RevenueCat에 유저 ID 연동
        if (user?.uid) {
          await setRevenueCatUserId(user.uid);
          
          // RevenueCat에서 구매 상태 확인
          const hasPurchase = await checkPurchaseStatus();
          if (hasPurchase) {
            setAdsRemoved(true);
            // Firebase에도 동기화
            updateDoc(doc(db, 'users', user.uid), {
              adsRemoved: true,
              adsRemovedAt: new Date().toISOString(),
            }).catch(console.error);
          }
        }
      }
    };

    setupIAP();

    return () => {
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
          
          // 로그인 스트릭 업데이트
          try {
            const { updateLoginStreak } = await import('../services/userEngagement');
            await updateLoginStreak(firebaseUser.uid);
          } catch (error) {
            console.error('Error updating login streak:', error);
          }
          
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

  // 닉네임만으로 로그인 (익명 인증 사용)
  const login = async (displayName, language) => {
    try {
      setLoading(true);
      console.log('Starting login with nickname:', displayName);

      // 닉네임 중복 체크
      const displayNameQuery = query(collection(db, 'users'), where('displayName', '==', displayName));
      const displayNameSnapshot = await getDocs(displayNameQuery);
      if (!displayNameSnapshot.empty) {
        console.log('Display name already exists:', displayName);
        throw new Error(language === 'en' ? 'This nickname is already in use.' : 'このニックネームはすでに使用されています。');
      }

      // Firebase Anonymous Authentication으로 로그인
      console.log('Signing in anonymously...');
      const userCredential = await signInAnonymously(auth);
      const firebaseUser = userCredential.user;
      console.log('Anonymous login successful:', firebaseUser.uid);

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
        displayName,
        language,
        deviceId,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        provider: 'anonymous',
        deleted: false
      });

      // 프로필 설정
      const profileData = {
        uid: firebaseUser.uid,
        displayName,
        language,
        deviceId,
        provider: 'anonymous'
      };

      setUserProfile(profileData);
      setUser(firebaseUser);
      setLoading(false);

      return profileData;
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
    login,
    logout,
    deleteAccount,
    loading,
    setUserProfile,
    adsRemoved,
    setAdsRemoved,
    handleRestorePurchases,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
