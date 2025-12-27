import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * 푸시 알림 등록
 */
export async function registerForPushNotifications() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * 푸시 알림 전송 (Firebase Cloud Messaging 또는 Expo Push Notification)
 */
export async function sendPushNotification(pushToken, title, body, data = {}) {
  try {
    if (!pushToken) {
      console.log('No push token provided');
      return;
    }
    
    // Expo Push Notification 사용
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    };
    
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    const result = await response.json();
    console.log('Push notification sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

/**
 * 알림 강화 서비스
 * 매칭, 미션, 스트릭, 초대 등 다양한 알림 처리
 */

/**
 * 매칭 성공 알림
 */
export async function sendMatchNotification(userId, matchedUserId, matchedUserName) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    if (!userData?.pushToken) return;
    
    const language = userData.language || 'en';
    const titles = {
      en: 'New Match! 🎉',
      es: '¡Nueva Coincidencia! 🎉',
      zh: '新匹配！🎉',
      ja: '新しいマッチ！🎉'
    };
    
    const messages = {
      en: `${matchedUserName} wants to chat with you!`,
      es: `¡${matchedUserName} quiere chatear contigo!`,
      zh: `${matchedUserName} 想与您聊天！`,
      ja: `${matchedUserName}さんがチャットしたいと言っています！`
    };
    
    await sendPushNotification(
      userData.pushToken,
      titles[language] || titles.en,
      messages[language] || messages.en,
      { type: 'match', userId: matchedUserId }
    );
  } catch (error) {
    console.error('Error sending match notification:', error);
  }
}

/**
 * 미션 완료 알림
 */
export async function sendMissionCompleteNotification(userId, missionType) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    if (!userData?.pushToken) return;
    
    const language = userData.language || 'en';
    const titles = {
      en: 'Mission Complete! 🎯',
      es: '¡Misión Completada! 🎯',
      zh: '任务完成！🎯',
      ja: 'ミッション完了！🎯'
    };
    
    const missionNames = {
      send_messages: {
        en: 'Send Messages',
        es: 'Enviar Mensajes',
        zh: '发送消息',
        ja: 'メッセージを送信'
      },
      start_chats: {
        en: 'Start Chats',
        es: 'Iniciar Chats',
        zh: '开始聊天',
        ja: 'チャットを開始'
      },
      login_streak: {
        en: 'Login Streak',
        es: 'Racha de Inicio de Sesión',
        zh: '登录连续天数',
        ja: 'ログインストリーク'
      },
      invite_friends: {
        en: 'Invite Friends',
        es: 'Invitar Amigos',
        zh: '邀请朋友',
        ja: '友達を招待'
      },
    };
    
    const missionName = missionNames[missionType]?.[language] || missionNames[missionType]?.en || missionType;
    
    const messages = {
      en: `You completed "${missionName}" mission! Claim your reward.`,
      es: `¡Completaste la misión "${missionName}"! Reclama tu recompensa.`,
      zh: `您完成了"${missionName}"任务！领取您的奖励。`,
      ja: `"${missionName}"ミッションを完了しました！報酬を受け取りましょう。`
    };
    
    await sendPushNotification(
      userData.pushToken,
      titles[language] || titles.en,
      messages[language] || messages.en,
      { type: 'mission', missionType }
    );
  } catch (error) {
    console.error('Error sending mission notification:', error);
  }
}

/**
 * 스트릭 유지 알림
 */
export async function sendStreakNotification(userId, streak) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    if (!userData?.pushToken) return;
    
    // 특정 스트릭일 때만 알림 (3일, 7일, 14일, 30일 등)
    const milestoneStreaks = [3, 7, 14, 30, 60, 90];
    if (!milestoneStreaks.includes(streak)) return;
    
    const language = userData.language || 'en';
    const titles = {
      en: 'Streak Milestone! 🔥',
      es: '¡Hito de Racha! 🔥',
      zh: '连续天数里程碑！🔥',
      ja: 'ストリークマイルストーン！🔥'
    };
    
    const messages = {
      en: `Amazing! You've logged in ${streak} days in a row! Keep it up!`,
      es: `¡Increíble! ¡Has iniciado sesión ${streak} días seguidos! ¡Sigue así!`,
      zh: `太棒了！您已连续登录 ${streak} 天！继续加油！`,
      ja: `素晴らしい！${streak}日連続でログインしています！続けましょう！`
    };
    
    await sendPushNotification(
      userData.pushToken,
      titles[language] || titles.en,
      messages[language] || messages.en,
      { type: 'streak', streak }
    );
  } catch (error) {
    console.error('Error sending streak notification:', error);
  }
}

/**
 * 친구 초대 수락 알림
 */
export async function sendInviteAcceptedNotification(inviterId, inviteeName) {
  try {
    const inviterDoc = await getDoc(doc(db, 'users', inviterId));
    const inviterData = inviterDoc.data();
    
    if (!inviterData?.pushToken) return;
    
    const language = inviterData.language || 'en';
    const titles = {
      en: 'Friend Joined! 🎉',
      es: '¡Amigo Se Unió! 🎉',
      zh: '朋友加入！🎉',
      ja: '友達が参加しました！🎉'
    };
    
    const messages = {
      en: `${inviteeName} joined using your invite code! You both earned rewards!`,
      es: `¡${inviteeName} se unió usando tu código de invitación! ¡Ambos ganaron recompensas!`,
      zh: `${inviteeName} 使用您的邀请码加入了！你们都获得了奖励！`,
      ja: `${inviteeName}さんがあなたの招待コードで参加しました！両方とも報酬を獲得しました！`
    };
    
    await sendPushNotification(
      inviterData.pushToken,
      titles[language] || titles.en,
      messages[language] || messages.en,
      { type: 'invite_accepted', inviteeName }
    );
  } catch (error) {
    console.error('Error sending invite notification:', error);
  }
}

/**
 * 스트릭 위험 알림 (스트릭이 끊길 위험이 있을 때)
 */
export async function sendStreakWarningNotification(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    if (!userData?.pushToken) return;
    
    const lastLoginDate = userData.lastLoginDate;
    if (!lastLoginDate) return;
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // 어제 로그인했고 오늘 아직 로그인 안 했으면 경고
    if (lastLoginDate === yesterdayStr) {
      const language = userData.language || 'en';
      const titles = {
        en: 'Don\'t Break Your Streak! ⚠️',
        es: '¡No Rompas Tu Racha! ⚠️',
        zh: '不要中断您的连续天数！⚠️',
        ja: 'ストリークを壊さないで！⚠️'
      };
      
      const messages = {
        en: 'Log in today to keep your streak going!',
        es: '¡Inicia sesión hoy para mantener tu racha!',
        zh: '今天登录以保持您的连续天数！',
        ja: '今日ログインしてストリークを続けましょう！'
      };
      
      await sendPushNotification(
        userData.pushToken,
        titles[language] || titles.en,
        messages[language] || messages.en,
        { type: 'streak_warning' }
      );
    }
  } catch (error) {
    console.error('Error sending streak warning notification:', error);
  }
}
