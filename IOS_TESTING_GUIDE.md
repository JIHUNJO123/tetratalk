# iOS 테스팅 가이드 (Windows 환경)

## ⚠️ Windows 제한사항

Windows에서는 iOS 시뮬레이터를 직접 실행할 수 없습니다. iOS 시뮬레이터는 macOS에서만 동작합니다.

## 📱 iOS 테스팅 방법

### 방법 1: 실제 iOS 기기에서 Expo Go 사용 (가장 빠름)

1. **Expo Go 앱 설치**
   - iPhone/iPad에서 App Store 열기
   - "Expo Go" 검색 후 설치

2. **개발 서버 시작**
   ```bash
   npx expo start
   ```

3. **연결 방법**
   - iPhone과 PC가 같은 Wi-Fi에 연결되어 있어야 함
   - 터미널에 표시된 QR 코드를 Expo Go 앱으로 스캔
   - 또는 터미널에서 `i` 키를 눌러 iOS에 연결

### 방법 2: EAS Build로 iOS 빌드 생성

#### Preview 빌드 (테스트용)
```bash
npx eas-cli build --platform ios --profile preview
```

#### Production 빌드 (TestFlight/App Store)
```bash
npx eas-cli build --platform ios --profile production
```

**요구사항:**
- Apple Developer 계정 필요
- iOS 기기 또는 TestFlight으로 테스트

### 방법 3: 클라우드 macOS 서비스 사용

- **MacStadium**: 클라우드 macOS 서버
- **AWS EC2 Mac**: macOS 인스턴스
- **MacinCloud**: 원격 macOS 접근

이 방법들은 유료 서비스입니다.

## 🚀 빠른 시작 (실제 iOS 기기)

1. **Expo 서버 시작**
   ```bash
   cd C:\Users\user\Desktop\spanishstep\tetratalk
   npx expo start
   ```

2. **iPhone에서 Expo Go 앱 실행**

3. **QR 코드 스캔 또는 `i` 키 입력**

## 📋 iOS 빌드 설정 확인

현재 `eas.json` 설정:
- ✅ Production 프로필 설정됨
- ✅ iOS 빌드 구성 설정됨
- ✅ 자동 버전 증가 활성화됨

## 🔧 필요한 설정

### Apple Developer 계정
- iOS 빌드를 위해서는 Apple Developer 계정이 필요합니다 ($99/년)
- TestFlight 배포를 위해서도 필요합니다

### 인증서 및 프로비저닝 프로파일
- EAS Build가 자동으로 관리합니다
- 첫 빌드 시 설정이 필요할 수 있습니다

## 💡 추천 방법

**가장 빠른 테스트**: 실제 iOS 기기 + Expo Go
**프로덕션 빌드**: EAS Build + TestFlight




