import React, { useState } from 'react';
import AdMobBannerComponent from '../components/AdMobBanner';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  SafeAreaView,
} from 'react-native';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { showInterstitial } from '../components/AdMobInterstitial';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [language, setLanguage] = useState('en');
  const [autoCompleteDisabled, setAutoCompleteDisabled] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  console.log('LoginScreen - isLogin:', isLogin, 'termsAccepted:', termsAccepted);
  // Google Sign-In 관련 상태 제거
  
  const { login, signup } = useAuth();

  // 입력 규칙 검증 함수 - 4개 언어 지원
  const getValidationError = (lang) => {
    const messages = {
      nicknameRequired: {
        en: 'Please enter a nickname.',
        es: 'Por favor ingrese un apodo.',
        zh: '请输入昵称。',
        ja: 'ニックネームを入力してください。'
      },
      nicknameLength: {
        en: 'Nickname must be 2-10 characters.',
        es: 'El apodo debe tener 2-10 caracteres.',
        zh: '昵称必须是2-10个字符。',
        ja: 'ニックネームは2～10文字です。'
      },
      nicknameInvalid: {
        en: 'Nickname can only contain letters or numbers.',
        es: 'El apodo solo puede contener letras o números.',
        zh: '昵称只能包含字母或数字。',
        ja: 'ニックネームは文字と数字のみ使用可能です。'
      },
      usernameRequired: {
        en: 'Please enter your email address.',
        es: 'Por favor ingrese su correo electrónico.',
        zh: '请输入您的电子邮件地址。',
        ja: 'メールアドレスを入力してください。'
      },
      usernameInvalid: {
        en: 'Please enter a valid email address.',
        es: 'Por favor ingrese un correo electrónico válido.',
        zh: '请输入有效的电子邮件地址。',
        ja: '有効なメールアドレスを入力してください。'
      },
      passwordRequired: {
        en: 'Please enter your password.',
        es: 'Por favor ingrese su contraseña.',
        zh: '请输入您的密码。',
        ja: 'パスワードを入力してください。'
      },
      passwordLength: {
        en: 'Password must be 6-20 characters.',
        es: 'La contraseña debe tener 6-20 caracteres.',
        zh: '密码必须是6-20个字符。',
        ja: 'パスワードは6～20文字です。'
      },
      passwordWeak: {
        en: 'Password must contain both letters and numbers.',
        es: 'La contraseña debe contener letras y números.',
        zh: '密码必须包含字母和数字。',
        ja: 'パスワードは英文と数字を両方含む必要があります。'
      },
      passwordMismatch: {
        en: 'Passwords do not match.',
        es: 'Las contraseñas no coinciden.',
        zh: '密码不匹配。',
        ja: 'パスワードが一致しません。'
      }
    };

    // 닉네임 규칙: 2-10자 (회원가입 시)
    if (!isLogin) {
      if (!displayName) {
        return messages.nicknameRequired[lang] || messages.nicknameRequired.en;
      }
      if (displayName.length < 2 || displayName.length > 10) {
        return messages.nicknameLength[lang] || messages.nicknameLength.en;
      }
      // 문자와 숫자만 허용 (모든 언어의 문자 포함)
      const nicknameRegex = /^[\p{L}\p{N}]+$/u;
      if (!nicknameRegex.test(displayName)) {
        return messages.nicknameInvalid[lang] || messages.nicknameInvalid.en;
      }
    }

    // 이메일 규칙: 유효한 이메일 형식
    if (!email) {
      return messages.usernameRequired[lang] || messages.usernameRequired.en;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return messages.usernameInvalid[lang] || messages.usernameInvalid.en;
    }

    // 비밀번호 규칙: 6-20자, 영문+숫자 조합
    if (!password) {
      return messages.passwordRequired[lang] || messages.passwordRequired.en;
    }
    if (password.length < 6 || password.length > 20) {
      return messages.passwordLength[lang] || messages.passwordLength.en;
    }
    // 영문과 숫자 모두 포함
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      return messages.passwordWeak[lang] || messages.passwordWeak.en;
    }
    // 비밀번호 확인
    if (!isLogin && password !== passwordConfirm) {
      return messages.passwordMismatch[lang] || messages.passwordMismatch.en;
    }

    return null; // 검증 통과
  };

  const handleAuth = async () => {
    if (isProcessing) return; // 중복 클릭 방지
    
    // 입력 규칙 검증
    const validationError = getValidationError(language);
    if (validationError) {
      const errorTitle = {
        en: 'Input Error',
        es: 'Error de Entrada',
        zh: '输入错误',
        ja: '入力エラー'
      };
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`⚠️ ${errorTitle[language] || errorTitle.en}\n\n${validationError}`);
      } else {
        Alert.alert(`⚠️ ${errorTitle[language] || errorTitle.en}`, validationError);
      }
      return;
    }

    setIsProcessing(true); // 처리 시작
    
    try {
      if (isLogin) {
        // 이메일과 비밀번호로 로그인 (선택한 언어 전달)
        await login(email, password, language);
        await showInterstitial(); // 로그인 성공 시 전면 광고 노출
      } else {
        // Google 회원가입 로직 제거
        {
          // 이용약관 동의 확인
          if (!termsAccepted) {
            const errorMessages = {
              en: 'Please agree to the Terms of Service to continue.',
              es: 'Por favor acepte los Términos de Servicio para continuar.',
              zh: '请同意服务条款以继续。',
              ja: '利用規約に同意してください。'
            };
            const errorTitles = {
              en: 'Terms Required',
              es: 'Términos Requeridos',
              zh: '需要条款',
              ja: '利用規約必須'
            };
            const errorMsg = errorMessages[language] || errorMessages.en;
            const errorTitle = errorTitles[language] || errorTitles.en;
            if (typeof window !== 'undefined' && window.alert) {
              window.alert(`⚠️ ${errorTitle}\n\n${errorMsg}`);
            } else {
              Alert.alert(`⚠️ ${errorTitle}`, errorMsg);
            }
            setIsProcessing(false); // 중요: return 전에 처리 상태 리셋
            return;
          }
          
          // 아이디 회원가입 - 한 번 더 검증
          const signupValidationError = getValidationError(language);
          if (signupValidationError) {
            const errorTitle = {
              en: 'Input Error',
              es: 'Error de Entrada',
              zh: '输入错误',
              ja: '入力エラー'
            };
            if (typeof window !== 'undefined' && window.alert) {
              window.alert(`⚠️ ${errorTitle[language] || errorTitle.en}\n\n${signupValidationError}`);
            } else {
              Alert.alert(`⚠️ ${errorTitle[language] || errorTitle.en}`, signupValidationError);
            }
            setIsProcessing(false); // 중요: return 전에 처리 상태 리셋
            return;
          }
          
          console.log('Calling signup with:', { email, displayName, language });
          const result = await signup(email, password, displayName, language);
          console.log('Signup result:', result);
          
          await showInterstitial(); // 회원가입 성공 시 전면 광고 노출
          
          // 회원가입 성공 시 안내
          const successTitles = {
            en: 'Registration Complete',
            es: 'Registro Completo',
            zh: '注册完成',
            ja: '会員登録完了'
          };
          const successMessages = {
            en: 'Your registration is complete!',
            es: '¡Su registro está completo!',
            zh: '您的注册已完成！',
            ja: '登録が完了しました！'
          };
          if (typeof window !== 'undefined' && window.alert) {
            window.alert(`✅ ${successTitles[language] || successTitles.en}\n\n${successMessages[language] || successMessages.en}`);
          } else {
            Alert.alert(`✅ ${successTitles[language] || successTitles.en}`, successMessages[language] || successMessages.en);
          }
          // 회원가입 성공하면 자동으로 로그인되므로 화면 전환 불필요
          setIsProcessing(false);
          return;
        }
      }
    } catch (error) {
      const errorMessages = {
        defaultError: {
          en: 'An error occurred.',
          es: 'Ocurrió un error.',
          zh: '发生错误。',
          ja: 'エラーが発生しました。'
        },
        permissionDenied: {
          en: 'Database permission error. Please contact support.',
          es: 'Error de permisos de base de datos. Por favor contacte soporte.',
          zh: '数据库权限错误。请联系支持。',
          ja: 'データベース権限エラーです。サポートにお問い合わせください。'
        },
        emailInUse: {
          en: 'This email address is already in use.',
          es: 'Este correo electrónico ya está en uso.',
          zh: '此电子邮件地址已被使用。',
          ja: 'このメールアドレスはすでに使用されています。'
        },
        invalidEmail: {
          en: 'Invalid email address format.',
          es: 'Formato de correo electrónico inválido.',
          zh: '无效的电子邮件地址格式。',
          ja: '無効なメールアドレス形式です。'
        },
        weakPassword: {
          en: 'Password must be at least 6 characters.',
          es: 'La contraseña debe tener al menos 6 caracteres.',
          zh: '密码必须至少6个字符。',
          ja: 'パスワードは6文字以上である必要があります。'
        },
        userNotFound: {
          en: 'Email not found. Please check your email address.',
          es: 'Correo electrónico no encontrado. Por favor verifique su correo.',
          zh: '未找到电子邮件。请检查您的电子邮件地址。',
          ja: 'メールアドレスが見つかりません。メールアドレスを確認してください。'
        },
        wrongPassword: {
          en: 'Incorrect email or password.',
          es: 'Correo electrónico o contraseña incorrectos.',
          zh: '电子邮件或密码不正确。',
          ja: 'メールアドレスまたはパスワードが間違っています。'
        },
        tooManyRequests: {
          en: 'Too many failed attempts. Please try again later.',
          es: 'Demasiados intentos fallidos. Por favor intente más tarde.',
          zh: '失败次数过多。请稍后再试。',
          ja: '試行回数が多すぎます。しばらくしてから再度お試しください。'
        }
      };
      
      let errorMessage = errorMessages.defaultError[language] || errorMessages.defaultError.en;

      // Firebase Auth 에러 코드 처리
      if (error.code) {
        switch (error.code) {
          case 'permission-denied':
          case 'auth/permission-denied':
            errorMessage = errorMessages.permissionDenied[language] || errorMessages.permissionDenied.en;
            break;
          case 'auth/email-already-in-use':
            errorMessage = errorMessages.emailInUse[language] || errorMessages.emailInUse.en;
            break;
          case 'auth/invalid-email':
            errorMessage = errorMessages.invalidEmail[language] || errorMessages.invalidEmail.en;
            break;
          case 'auth/weak-password':
            errorMessage = errorMessages.weakPassword[language] || errorMessages.weakPassword.en;
            break;
          case 'auth/user-not-found':
            errorMessage = errorMessages.userNotFound[language] || errorMessages.userNotFound.en;
            break;
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = errorMessages.wrongPassword[language] || errorMessages.wrongPassword.en;
            break;
          case 'auth/too-many-requests':
            errorMessage = errorMessages.tooManyRequests[language] || errorMessages.tooManyRequests.en;
            break;
          case 'auth/network-request-failed':
            const networkError = {
              en: 'Network error. Please check your connection.',
              es: 'Error de red. Por favor verifique su conexión.',
              zh: '网络错误。请检查您的连接。',
              ja: 'ネットワークエラーです。接続を確認してください。'
            };
            errorMessage = networkError[language] || networkError.en;
            break;
        }
      }

      // 커스텀 에러 메시지 (닉네임 중복, 디바이스 제한 등)는 그대로 표시
      if (error.message && !error.code) {
        if (
          error.message.includes('query is not defined') ||
          error.message.includes('collection is not defined') ||
          error.message.includes('where is not defined') ||
          error.message.includes('getDocs is not defined')
        ) {
          const systemError = {
            en: 'System error occurred. Please try again.',
            es: 'Ocurrió un error del sistema. Por favor intente nuevamente.',
            zh: '系统错误。请重试。',
            ja: 'システムエラーが発生しました。再度お試しください。'
          };
          errorMessage = systemError[language] || systemError.en;
        } else {
          errorMessage = error.message;
        }
      }

      console.error('Login/Signup error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        language: language,
        isLogin: isLogin
      });

      const failedTitles = {
        login: {
          en: 'Login Failed',
          es: 'Error al Iniciar Sesión',
          zh: '登录失败',
          ja: 'ログイン失敗'
        },
        signup: {
          en: 'Registration Failed',
          es: 'Error al Registrarse',
          zh: '注册失败',
          ja: '会員登録失敗'
        }
      };
      
      const title = isLogin 
        ? (failedTitles.login[language] || failedTitles.login.en)
        : (failedTitles.signup[language] || failedTitles.signup.en);

      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`❌ ${title}\n\n${errorMessage}`);
      } else {
        Alert.alert(`❌ ${title}`, errorMessage);
      }
    } finally {
      setIsProcessing(false); // 처리 완료 (성공/실패 모두)
    }
  };

  // Define text variables to simplify JSX
  const getTranslation = (key) => {
    const translations = {
      appTitle: {
        en: 'Chat Beyond Borders',
        es: 'Chatea Sin Fronteras',
        zh: '跨越边界聊天',
        ja: '国境を越えてチャット'
      },
      subtitle: {
        en: 'Break Language Barriers',
        es: 'Rompe las Barreras del Idioma',
        zh: '打破语言障碍',
        ja: '言語の壁を越えて'
      },
      description: {
        en: 'Connect across 4 languages instantly',
        es: 'Conéctate en 4 idiomas al instante',
        zh: '即时连接4种语言',
        ja: '4つの言語で瞬時につながる'
      },
      nicknamePlaceholder: {
        en: 'Nickname (2-10 characters)',
        es: 'Apodo (2-10 caracteres)',
        zh: '昵称 (2-10个字符)',
        ja: 'ニックネーム (2～10文字)'
      },
      idPlaceholder: {
        en: 'Email Address',
        es: 'Correo Electrónico',
        zh: '电子邮件地址',
        ja: 'メールアドレス'
      },
      passwordPlaceholder: {
        en: 'Password (6-20 chars, letters+numbers)',
        es: 'Contraseña (6-20 caracteres, letras+números)',
        zh: '密码 (6-20个字符，字母+数字)',
        ja: 'パスワード (6～20文字, 英数字)'
      },
      confirmPasswordPlaceholder: {
        en: 'Confirm Password',
        es: 'Confirmar Contraseña',
        zh: '确认密码',
        ja: 'パスワード確認'
      },
      selectLanguageLabel: {
        en: 'Select Language:',
        es: 'Seleccionar Idioma:',
        zh: '选择语言:',
        ja: '言語選択:'
      },
      loginButton: {
        en: 'Login',
        es: 'Iniciar Sesión',
        zh: '登录',
        ja: 'ログイン'
      },
      signupButton: {
        en: 'Sign Up',
        es: 'Registrarse',
        zh: '注册',
        ja: '会員登録'
      },
      switchToSignup: {
        en: 'Don\'t have an account? Sign Up',
        es: '¿No tienes cuenta? Regístrate',
        zh: '没有账户？注册',
        ja: 'アカウントをお持ちでないですか？会員登録'
      },
      switchToLogin: {
        en: 'Already have an account? Login',
        es: '¿Ya tienes cuenta? Inicia sesión',
        zh: '已有账户？登录',
        ja: 'すでにアカウントをお持ちですか？ログイン'
      },
      rulesTitle: {
        en: '📝 Registration Rules',
        es: '📝 Reglas de Registro',
        zh: '📝 注册规则',
        ja: '📝 登録ルール'
      },
      nicknameRule: {
        en: '• Nickname: 2-10 characters',
        es: '• Apodo: 2-10 caracteres',
        zh: '• 昵称：2-10个字符',
        ja: '• ニックネーム: 2～10文字'
      },
      idRule: {
        en: '• Email: Valid email address required',
        es: '• Correo: Se requiere correo electrónico válido',
        zh: '• 电子邮件：需要有效的电子邮件地址',
        ja: '• メール: 有効なメールアドレスが必要'
      },
      passwordRule: {
        en: '• Password: 6-20 characters (letters+numbers required)',
        es: '• Contraseña: 6-20 caracteres (letras+números requeridos)',
        zh: '• 密码：6-20个字符（需要字母+数字）',
        ja: '• パスワード: 6～20文字 (英文+数字必須)'
      },
      specialCharsRule: {
        en: '• Special characters not allowed in nickname',
        es: '• No se permiten caracteres especiales en apodo',
        zh: '• 昵称中不允许特殊字符',
        ja: '• 特殊文字はニックネームに使用不可'
      },
      dividerText: {
        en: 'OR',
        es: 'O',
        zh: '或',
        ja: 'または'
      },
      termsTitle: {
        en: 'TERMS OF SERVICE',
        es: 'TÉRMINOS DE SERVICIO',
        zh: '服务条款',
        ja: '利用規約'
      },
      termsContent: {
        en: `By using TetraChat, you agree to:

1. Prohibited Content
• No harassment, hate speech, discrimination
• No sexually explicit or pornographic content
• No spam, scams, or fraudulent activities
• No illegal content or activities
• No violence, threats, or self-harm content

2. User Conduct
• Be respectful to all users
• Use appropriate language
• Do not impersonate others
• Do not share personal information publicly

3. Content Moderation
• Reported content will be reviewed within 24 hours
• Violators may receive warnings or permanent bans
• Decisions are made at our discretion

4. Reporting & Blocking
• You can report inappropriate users/content
• You can block users at any time
• Use the in-app report feature

5. Consequences
• Minor violations: Warning
• Repeated violations: Permanent ban
• Serious violations: Immediate ban

Contact: jihun.jo@yahoo.com`,
        es: `Al usar TetraChat, usted acepta:

1. Contenido Prohibido
• No acoso, discurso de odio, discriminación
• No contenido sexualmente explícito o pornográfico
• No spam, estafas o actividades fraudulentas
• No contenido o actividades ilegales
• No violencia, amenazas o contenido de autolesiones

2. Conducta del Usuario
• Sea respetuoso con todos los usuarios
• Use lenguaje apropiado
• No se haga pasar por otros
• No comparta información personal públicamente

3. Moderación de Contenido
• El contenido reportado se revisará dentro de 24 horas
• Los infractores pueden recibir advertencias o prohibiciones permanentes
• Las decisiones se toman a nuestra discreción

4. Reportar y Bloquear
• Puede reportar usuarios/contenido inapropiado
• Puede bloquear usuarios en cualquier momento
• Use la función de reporte en la aplicación

5. Consecuencias
• Violaciones menores: Advertencia
• Violaciones repetidas: Prohibición permanente
• Violaciones graves: Prohibición inmediata

Contacto: jihun.jo@yahoo.com`,
        zh: `使用TetraChat即表示您同意：

1. 禁止内容
• 禁止骚扰、仇恨言论、歧视
• 禁止色情或露骨内容
• 禁止垃圾邮件、诈骗或欺诈活动
• 禁止非法内容或活动
• 禁止暴力、威胁或自残内容

2. 用户行为
• 尊重所有用户
• 使用适当的语言
• 不要冒充他人
• 不要公开分享个人信息

3. 内容审核
• 举报的内容将在24小时内审查
• 违规者可能会收到警告或永久封禁
• 决定由我们自行决定

4. 举报和屏蔽
• 您可以举报不当用户/内容
• 您可以随时屏蔽用户
• 使用应用内的举报功能

5. 后果
• 轻微违规：警告
• 重复违规：永久封禁
• 严重违规：立即封禁

联系方式：jihun.jo@yahoo.com`,
        ja: `TetraChatを使用することで、以下に同意します：

1. 禁止コンテンツ
• ハラスメント、ヘイトスピーチ、差別の禁止
• 性的に露骨またはポルノコンテンツの禁止
• スパム、詐欺、不正行為の禁止
• 違法なコンテンツや活動の禁止
• 暴力、脅迫、自傷コンテンツの禁止

2. ユーザー行動規範
• すべてのユーザーに敬意を払う
• 適切な言葉遣いを使用する
• 他人になりすましない
• 個人情報を公開しない

3. コンテンツモデレーション
• 報告されたコンテンツは24時間以内に審査されます
• 違反者は警告または永久禁止される場合があります
• 決定は当社の裁量で行われます

4. 報告とブロック
• 不適切なユーザー/コンテンツを報告可能
• いつでもユーザーをブロック可能
• アプリ内の報告機能を使用

5. 結果
• 軽微な違反：警告
• 繰り返し違反：永久禁止
• 重大な違反：即時禁止

連絡先：jihun.jo@yahoo.com`
      },
      termsAgreeText: {
        en: 'I have read and agree to the Terms of Service',
        es: 'He leído y acepto los Términos de Servicio',
        zh: '我已阅读并同意服务条款',
        ja: '利用規約を読んで同意しました'
      },
      processing: {
        en: 'Processing...',
        es: 'Procesando...',
        zh: '处理中...',
        ja: '処理中...'
      }
    };
    return translations[key]?.[language] || translations[key]?.en || '';
  };
  
  const appTitle = getTranslation('appTitle');
  const subtitle = getTranslation('subtitle');
  const description = getTranslation('description');
  const nicknamePlaceholder = getTranslation('nicknamePlaceholder');
  const idPlaceholder = getTranslation('idPlaceholder');
  const passwordPlaceholder = getTranslation('passwordPlaceholder');
  const confirmPasswordPlaceholder = getTranslation('confirmPasswordPlaceholder');
  const selectLanguageLabel = getTranslation('selectLanguageLabel');
  const loginButtonText = isLogin ? getTranslation('loginButton') : getTranslation('signupButton');
  const switchButtonText = isLogin ? getTranslation('switchToSignup') : getTranslation('switchToLogin');
  const rulesTitle = getTranslation('rulesTitle');
  const nicknameRule = getTranslation('nicknameRule');
  const idRule = getTranslation('idRule');
  const passwordRule = getTranslation('passwordRule');
  const specialCharsRule = getTranslation('specialCharsRule');
  const dividerText = getTranslation('dividerText');

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 언어 전환 버튼 */}
        <View style={styles.languageSwitcher}>
          <TouchableOpacity
            style={[styles.languageSwitchButton, language === 'en' && styles.languageSwitchButtonActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.languageSwitchText, language === 'en' && styles.languageSwitchTextActive]}>
              EN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.languageSwitchButton, language === 'es' && styles.languageSwitchButtonActive]}
            onPress={() => setLanguage('es')}
          >
            <Text style={[styles.languageSwitchText, language === 'es' && styles.languageSwitchTextActive]}>
              ES
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.languageSwitchButton, language === 'zh' && styles.languageSwitchButtonActive]}
            onPress={() => setLanguage('zh')}
          >
            <Text style={[styles.languageSwitchText, language === 'zh' && styles.languageSwitchTextActive]}>
              中
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.languageSwitchButton, language === 'ja' && styles.languageSwitchButtonActive]}
            onPress={() => setLanguage('ja')}
          >
            <Text style={[styles.languageSwitchText, language === 'ja' && styles.languageSwitchTextActive]}>
              JA
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.appName}>TetraChat</Text>
          <Text style={styles.title}>🌏🌐</Text>
          <Text style={styles.appTitle}>
            {appTitle}
          </Text>
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
          <Text style={styles.description}>
            {description}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder={nicknamePlaceholder}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="none"
              maxLength={10}
            />
          )}
          
          <TextInput
            style={styles.input}
            placeholder={idPlaceholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            style={styles.input}
            placeholder={passwordPlaceholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            maxLength={20}
          />
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder={confirmPasswordPlaceholder}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry
              maxLength={20}
            />
          )}

          {!isLogin && (
            <View style={styles.termsContainer}>
              <Text style={styles.termsTitle}>
                {getTranslation('termsTitle')}
              </Text>
              <ScrollView style={styles.termsScrollView} nestedScrollEnabled={true}>
                <Text style={styles.termsContent}>
                  {getTranslation('termsContent')}
                </Text>
              </ScrollView>
              <TouchableOpacity
                style={styles.termsCheckbox}
                onPress={() => setTermsAccepted(!termsAccepted)}
              >
                <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                  {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsAgreeText}>
                  {getTranslation('termsAgreeText')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {!isLogin && (
            <View style={styles.languageContainer}>
              <Text style={styles.languageLabel}>
                {selectLanguageLabel}
              </Text>
              <View style={styles.languageButtons}>
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    language === 'en' && styles.languageButtonActive,
                  ]}
                  onPress={() => setLanguage('en')}
                >
                  <Text style={[
                    styles.languageButtonText,
                    language === 'en' && styles.languageButtonTextActive,
                  ]}>
                    English
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    language === 'es' && styles.languageButtonActive,
                  ]}
                  onPress={() => setLanguage('es')}
                >
                  <Text style={[
                    styles.languageButtonText,
                    language === 'es' && styles.languageButtonTextActive,
                  ]}>
                    Español
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    language === 'zh' && styles.languageButtonActive,
                  ]}
                  onPress={() => setLanguage('zh')}
                >
                  <Text style={[
                    styles.languageButtonText,
                    language === 'zh' && styles.languageButtonTextActive,
                  ]}>
                    中文
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    language === 'ja' && styles.languageButtonActive,
                  ]}
                  onPress={() => setLanguage('ja')}
                >
                  <Text style={[
                    styles.languageButtonText,
                    language === 'ja' && styles.languageButtonTextActive,
                  ]}>
                    日本語
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!isLogin && (
            <View style={styles.rulesContainer}>
              <Text style={styles.rulesTitle}>
                {rulesTitle}
              </Text>
              <Text style={styles.rulesText}>
                {nicknameRule}
              </Text>
              <Text style={styles.rulesText}>
                {idRule}
              </Text>
              <Text style={styles.rulesText}>
                {passwordRule}
              </Text>
              <Text style={styles.rulesText}>
                {specialCharsRule}
              </Text>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.button, isProcessing && styles.buttonDisabled]} 
            onPress={handleAuth}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>
              {isProcessing ? getTranslation('processing') : loginButtonText}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>
              {dividerText}
            </Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign-In 버튼 및 로직 완전 제거 */}

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchButtonText}>
              {switchButtonText}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <AdMobBannerComponent screenType="login" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#5f4dee',
  },
  container: {
    flex: 1,
    backgroundColor: '#5f4dee',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  languageSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  languageSwitchButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  languageSwitchButtonActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  languageSwitchText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  languageSwitchTextActive: {
    color: '#667eea',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 5,
    color: '#ffffff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  title: {
    fontSize: 50,
    marginBottom: 15,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  form: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  input: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  languageContainer: {
    marginBottom: 15,
  },
  languageLabel: {
    fontSize: 16,
    marginBottom: 12,
    color: '#495057',
    fontWeight: '600',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  languageButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  languageButtonActive: {
    borderColor: '#667eea',
    backgroundColor: '#667eea',
  },
  languageButtonText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '600',
  },
  languageButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  termsContainer: {
    marginTop: 10,
    marginBottom: 15,
    paddingVertical: 15,
    paddingHorizontal: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffc107',
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 10,
    textAlign: 'center',
  },
  termsScrollView: {
    maxHeight: 200,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  termsContent: {
    fontSize: 11,
    color: '#495057',
    lineHeight: 16,
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsAgreeText: {
    fontSize: 13,
    color: '#495057',
    flex: 1,
    marginLeft: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 6,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#667eea',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: '#495057',
  },
  termsLink: {
    fontSize: 14,
    color: '#667eea',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#adb5bd',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#dee2e6',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#6c757d',
    fontSize: 14,
  },
  googleButtonContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  googleButton: {
    width: 175,
    height: 40,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  rulesContainer: {
    backgroundColor: '#e7f3ff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 10,
  },
  rulesText: {
    fontSize: 13,
    color: '#495057',
    marginBottom: 5,
    lineHeight: 20,
  },
});
