import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

/**
 * 스마트 매칭 알고리즘
 * 사용자의 선호도, 활동 시간, 언어 레벨 등을 고려한 매칭
 */

/**
 * 사용자 매칭 점수 계산
 */
function calculateMatchScore(user, targetUser, currentUserProfile) {
  let score = 0;
  
  // 1. 언어 매칭 (가장 중요) - 40점
  if (user.language !== currentUserProfile.language) {
    score += 40;
  }
  
  // 2. 최근 활동 시간 (24시간 이내) - 30점
  if (targetUser.lastActiveAt) {
    const lastActive = targetUser.lastActiveAt.toDate ? targetUser.lastActiveAt.toDate() : new Date(targetUser.lastActiveAt);
    const hoursSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceActive < 1) {
      score += 30;
    } else if (hoursSinceActive < 6) {
      score += 20;
    } else if (hoursSinceActive < 24) {
      score += 10;
    }
  }
  
  // 3. 활동 레벨 (메시지 수 기반) - 15점
  const messageCount = targetUser.totalMessages || 0;
  if (messageCount > 100) {
    score += 15;
  } else if (messageCount > 50) {
    score += 10;
  } else if (messageCount > 10) {
    score += 5;
  }
  
  // 4. 로그인 스트릭 (활발한 사용자) - 10점
  const streak = targetUser.loginStreak || 0;
  if (streak >= 7) {
    score += 10;
  } else if (streak >= 3) {
    score += 5;
  }
  
  // 5. 온라인 상태 (가능하면) - 5점
  if (targetUser.isOnline) {
    score += 5;
  }
  
  // 6. 프로필 완성도 - 5점
  if (targetUser.bio || targetUser.interests) {
    score += 5;
  }
  
  return score;
}

/**
 * 스마트 매칭으로 사용자 목록 가져오기
 */
export async function getSmartMatchedUsers(currentUserId, currentUserProfile, maxResults = 20) {
  try {
    // 1. 기본 필터링: 같은 언어 제외, 삭제되지 않은 사용자
    const usersQuery = query(
      collection(db, 'users'),
      where('deleted', '==', false),
      orderBy('lastActiveAt', 'desc'),
      limit(100) // 먼저 최근 활동한 100명 가져오기
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    const allUsers = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // 2. 현재 사용자와 다른 언어만 필터링
    const filteredUsers = allUsers.filter(user => 
      user.id !== currentUserId && 
      user.language !== currentUserProfile.language
    );
    
    // 3. 매칭 점수 계산 및 정렬
    const usersWithScores = filteredUsers.map(user => ({
      ...user,
      matchScore: calculateMatchScore(user, user, currentUserProfile),
    }));
    
    // 4. 점수 순으로 정렬
    usersWithScores.sort((a, b) => b.matchScore - a.matchScore);
    
    // 5. 상위 N명 반환
    return usersWithScores.slice(0, maxResults);
  } catch (error) {
    console.error('Error getting smart matched users:', error);
    return [];
  }
}

/**
 * 시간대 기반 매칭 (같은 시간대에 활동하는 사용자 우선)
 */
export function getTimeZoneBasedMatches(users, currentUserTimeZone) {
  // 현재 시간대 계산 (간단한 버전)
  const currentHour = new Date().getHours();
  
  return users.map(user => {
    let timeScore = 0;
    
    // 사용자의 일반적인 활동 시간과 현재 시간 비교
    if (user.preferredActiveHours) {
      const [startHour, endHour] = user.preferredActiveHours;
      if (currentHour >= startHour && currentHour <= endHour) {
        timeScore = 20; // 활동 시간대에 있으면 보너스
      }
    }
    
    return {
      ...user,
      timeScore,
      totalScore: (user.matchScore || 0) + timeScore,
    };
  }).sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * 관심사 기반 매칭 (향후 확장용)
 */
export function getInterestBasedMatches(users, currentUserInterests) {
  if (!currentUserInterests || currentUserInterests.length === 0) {
    return users;
  }
  
  return users.map(user => {
    let interestScore = 0;
    
    if (user.interests && Array.isArray(user.interests)) {
      const commonInterests = user.interests.filter(interest =>
        currentUserInterests.includes(interest)
      );
      interestScore = commonInterests.length * 10; // 공통 관심사당 10점
    }
    
    return {
      ...user,
      interestScore,
      totalScore: (user.matchScore || 0) + interestScore,
    };
  }).sort((a, b) => b.totalScore - a.totalScore);
}





