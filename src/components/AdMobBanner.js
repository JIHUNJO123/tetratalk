import React from 'react';
import { View, Platform } from 'react-native';

// 웹에서는 AdMob을 import하지 않음
let BannerAd, BannerAdSize, TestIds;
if (Platform.OS !== 'web') {
  const admob = require('react-native-google-mobile-ads');
  BannerAd = admob.BannerAd;
  BannerAdSize = admob.BannerAdSize;
  TestIds = admob.TestIds;
}

export default function AdMobBannerComponent({ screenType }) {
  // 웹에서는 광고 대신 빈 공간 표시
  if (Platform.OS === 'web') {
    return <View style={{ height: 50 }} />;
  }

  // 개발 중에는 테스트 광고 ID 사용, 프로덕션에서는 실제 ID 사용
  // TestFlight 및 개발 빌드에서는 테스트 광고 사용
  const USE_TEST_ADS = true; // 앱 승인 후 false로 변경
  
  const getAdUnitID = () => {
    // 테스트 광고 모드
    if (USE_TEST_ADS) {
      return TestIds.BANNER;
    }
    
    // 프로덕션에서는 실제 광고 ID 사용
    if (Platform.OS === 'ios') {
      // 화면별 배너 광고
      if (screenType === 'chatList') {
        return 'ca-app-pub-5837885590326347/8321246671'; // ChatListScreen iOS
      } else if (screenType === 'chat') {
        return 'ca-app-pub-5837885590326347/7199736691'; // ChatScreen iOS
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
