import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * 사용자 참여도 및 유지 기능 관리
 */

// 일일 미션 타입
export const MISSION_TYPES = {
  SEND_MESSAGES: 'send_messages', // 메시지 보내기
  START_CHATS: 'start_chats', // 채팅 시작하기
  LOGIN_STREAK: 'login_streak', // 로그인 스트릭
  INVITE_FRIENDS: 'invite_friends', // 친구 초대
};

// 미션 목표값
export const MISSION_TARGETS = {
  [MISSION_TYPES.SEND_MESSAGES]: 10, // 10개 메시지
  [MISSION_TYPES.START_CHATS]: 3, // 3개 채팅 시작
  [MISSION_TYPES.LOGIN_STREAK]: 1, // 1일 로그인
  [MISSION_TYPES.INVITE_FRIENDS]: 1, // 1명 초대
};

// 미션 보상
export const MISSION_REWARDS = {
  [MISSION_TYPES.SEND_MESSAGES]: { points: 10, badge: null },
  [MISSION_TYPES.START_CHATS]: { points: 20, badge: 'chat_starter' },
  [MISSION_TYPES.LOGIN_STREAK]: { points: 5, badge: null },
  [MISSION_TYPES.INVITE_FRIENDS]: { points: 50, badge: 'inviter' },
};

/**
 * 사용자의 일일 미션 데이터 가져오기
 */
export async function getUserMissions(userId) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const missionDoc = await getDoc(doc(db, 'userMissions', `${userId}_${today}`));
    
    if (missionDoc.exists()) {
      return missionDoc.data();
    }
    
    // 새 미션 생성
    const newMissions = {
      userId,
      date: today,
      missions: {
        [MISSION_TYPES.SEND_MESSAGES]: { progress: 0, completed: false, rewardClaimed: false },
        [MISSION_TYPES.START_CHATS]: { progress: 0, completed: false, rewardClaimed: false },
        [MISSION_TYPES.LOGIN_STREAK]: { progress: 0, completed: false, rewardClaimed: false },
        [MISSION_TYPES.INVITE_FRIENDS]: { progress: 0, completed: false, rewardClaimed: false },
      },
      createdAt: serverTimestamp(),
    };
    
    await setDoc(doc(db, 'userMissions', `${userId}_${today}`), newMissions);
    return newMissions;
  } catch (error) {
    console.error('Error getting user missions:', error);
    return null;
  }
}

/**
 * 미션 진행도 업데이트
 */
export async function updateMissionProgress(userId, missionType, increment = 1) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const missionId = `${userId}_${today}`;
    const missionDoc = await getDoc(doc(db, 'userMissions', missionId));
    
    if (!missionDoc.exists()) {
      await getUserMissions(userId); // 미션 초기화
    }
    
    const missionData = missionDoc.data();
    const currentProgress = missionData.missions[missionType]?.progress || 0;
    const target = MISSION_TARGETS[missionType];
    const newProgress = Math.min(currentProgress + increment, target);
    const completed = newProgress >= target;
    
    await updateDoc(doc(db, 'userMissions', missionId), {
      [`missions.${missionType}.progress`]: newProgress,
      [`missions.${missionType}.completed`]: completed,
      updatedAt: serverTimestamp(),
    });
    
    return { progress: newProgress, completed, target };
  } catch (error) {
    console.error('Error updating mission progress:', error);
    return null;
  }
}

/**
 * 미션 보상 받기
 */
export async function claimMissionReward(userId, missionType) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const missionId = `${userId}_${today}`;
    const missionDoc = await getDoc(doc(db, 'userMissions', missionId));
    
    if (!missionDoc.exists()) {
      return { success: false, message: 'Mission not found' };
    }
    
    const mission = missionDoc.data().missions[missionType];
    
    if (!mission.completed) {
      return { success: false, message: 'Mission not completed' };
    }
    
    if (mission.rewardClaimed) {
      return { success: false, message: 'Reward already claimed' };
    }
    
    const reward = MISSION_REWARDS[missionType];
    
    // 사용자 프로필에 포인트 추가
    const userDoc = await getDoc(doc(db, 'users', userId));
    const currentPoints = userDoc.data()?.points || 0;
    
    await updateDoc(doc(db, 'users', userId), {
      points: currentPoints + reward.points,
      updatedAt: serverTimestamp(),
    });
    
    // 배지 추가
    if (reward.badge) {
      const badges = userDoc.data()?.badges || [];
      if (!badges.includes(reward.badge)) {
        await updateDoc(doc(db, 'users', userId), {
          badges: [...badges, reward.badge],
        });
      }
    }
    
    // 보상 수령 표시
    await updateDoc(doc(db, 'userMissions', missionId), {
      [`missions.${missionType}.rewardClaimed`]: true,
    });
    
    return { success: true, reward };
  } catch (error) {
    console.error('Error claiming mission reward:', error);
    return { success: false, message: error.message };
  }
}

/**
 * 로그인 스트릭 업데이트
 */
export async function updateLoginStreak(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    const today = new Date().toISOString().split('T')[0];
    const lastLoginDate = userData?.lastLoginDate;
    const currentStreak = userData?.loginStreak || 0;
    
    let newStreak = 1;
    
    if (lastLoginDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastLoginDate === yesterdayStr) {
        // 연속 로그인
        newStreak = currentStreak + 1;
      } else if (lastLoginDate === today) {
        // 오늘 이미 로그인함
        newStreak = currentStreak;
      } else {
        // 스트릭 끊김
        newStreak = 1;
      }
    }
    
    await updateDoc(doc(db, 'users', userId), {
      lastLoginDate: today,
      loginStreak: newStreak,
      longestStreak: Math.max(newStreak, userData?.longestStreak || 0),
      updatedAt: serverTimestamp(),
    });
    
    // 스트릭 미션 업데이트
    if (newStreak > currentStreak) {
      await updateMissionProgress(userId, MISSION_TYPES.LOGIN_STREAK);
    }
    
    return { streak: newStreak };
  } catch (error) {
    console.error('Error updating login streak:', error);
    return null;
  }
}

/**
 * 사용자 통계 가져오기
 */
export async function getUserStats(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    return {
      points: userData?.points || 0,
      loginStreak: userData?.loginStreak || 0,
      longestStreak: userData?.longestStreak || 0,
      badges: userData?.badges || [],
      totalMessages: userData?.totalMessages || 0,
      totalChats: userData?.totalChats || 0,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
}





