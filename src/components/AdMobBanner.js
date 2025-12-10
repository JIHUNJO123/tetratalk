import React from 'react';
import { View, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

// 웹에서는 AdMob을 import하지 않음
let BannerAd, BannerAdSize;
if (Platform.OS !== 'web') {
  const admob = require('react-native-google-mobile-ads');
  BannerAd = admob.BannerAd;
  BannerAdSize = admob.BannerAdSize;
}

export default function AdMobBannerComponent({ screenType }) {
  const { adsRemoved } = useAuth();

  // 광고 제거 구매한 사용자는 광고 숨김
  if (adsRemoved) {
    return null;
  }

  // 웹에서는 광고 표시 안함
  if (Platform.OS === 'web') {
    return null;
  }

  // 프로덕션 광고 ID
  const getAdUnitID = () => {
    if (Platform.OS === 'ios') {
      // 화면별 배너 광고
      if (screenType === 'chatList') {
        return 'ca-app-pub-5837885590326347/8321246671'; // ChatListScreen iOS
      } else if (screenType === 'chat') {
        return 'ca-app-pub-5837885590326347/1755838329'; // ChatScreen iOS
      } else {
        return 'ca-app-pub-5837885590326347/8321246671'; // Default iOS
      }
    } else if (Platform.OS === 'android') {
      // 화면별 배너 광고
      if (screenType === 'chatList') {
        return 'ca-app-pub-5837885590326347/6050306551'; // ChatListScreen Android
      } else if (screenType === 'chat') {
        return 'ca-app-pub-5837885590326347/7199736691'; // ChatScreen Android
      } else {
        return 'ca-app-pub-5837885590326347/6050306551'; // Default Android
      }
    }
  };

  return (
    <View style={{ alignItems: 'center', marginVertical: 10 }}>
      <BannerAd
        unitId={getAdUnitID()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
          console.error('Banner ad failed to load:', error);
        }}
        onAdLoaded={() => {
          console.log('Banner ad loaded successfully');
        }}
      />
    </View>
  );
}
