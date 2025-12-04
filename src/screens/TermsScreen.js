import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

const TermsScreen = ({ navigation, route }) => {
  const [agreed, setAgreed] = useState(false);
  const { onAccept, language = 'en' } = route.params || {};

  const getTranslation = (key) => {
    const translations = {
      title: {
        en: 'Terms of Service',
        es: 'Términos de Servicio',
        zh: '服务条款',
        ja: '利用規約'
      },
      lastUpdated: {
        en: 'Last Updated: November 27, 2025',
        es: 'Última actualización: 27 de noviembre de 2025',
        zh: '最后更新：2025年11月27日',
        ja: '最終更新: 2025年11月27日'
      },
      section1Title: {
        en: '1. Acceptance of Terms',
        es: '1. Aceptación de Términos',
        zh: '1. 条款接受',
        ja: '1. 規約の承認'
      },
      section1Text: {
        en: 'By creating an account and using TetraChat, you agree to comply with these Terms of Service.',
        es: 'Al crear una cuenta y usar TetraChat, usted acepta cumplir con estos Términos de Servicio.',
        zh: '通过创建账户和使用TetraChat，您同意遵守这些服务条款。',
        ja: 'アカウントを作成しTetraChatを使用することで、本利用規約に同意したものとみなされます。'
      },
      section2Title: {
        en: '2. Prohibited Content',
        es: '2. Contenido Prohibido',
        zh: '2. 禁止内容',
        ja: '2. 禁止コンテンツ'
      },
      section2Text: {
        en: 'Users must not post, share, or transmit any content that is:',
        es: 'Los usuarios no deben publicar, compartir o transmitir ningún contenido que sea:',
        zh: '用户不得发布、分享或传输以下内容：',
        ja: 'ユーザーは以下のようなコンテンツを投稿、共有、送信してはなりません：'
      },
      prohibited1: {
        en: '• Harassing, threatening, or abusive',
        es: '• Acosador, amenazante o abusivo',
        zh: '• 骚扰、威胁或辱骂性的',
        ja: '• 嫌がらせ、脅迫、または虐待的なもの'
      },
      prohibited2: {
        en: '• Hateful, discriminatory, or promoting violence',
        es: '• Odioso, discriminatorio o que promueva la violencia',
        zh: '• 仇恨、歧视或煽动暴力的',
        ja: '• 憎悪的、差別的、または暴力を助長するもの'
      },
      prohibited3: {
        en: '• Sexually explicit or inappropriate',
        es: '• Sexualmente explícito o inapropiado',
        zh: '• 色情或不当的',
        ja: '• 性的に露骨または不適切なもの'
      },
      prohibited4: {
        en: '• Spam or advertising',
        es: '• Spam o publicidad',
        zh: '• 垃圾邮件或广告',
        ja: '• スパムまたは広告'
      },
      prohibited5: {
        en: '• Illegal or promotes illegal activities',
        es: '• Ilegal o que promueva actividades ilegales',
        zh: '• 非法或促进非法活动的',
        ja: '• 違法または違法行為を助長するもの'
      },
      prohibited6: {
        en: '• Violates intellectual property rights',
        es: '• Viola los derechos de propiedad intelectual',
        zh: '• 侵犯知识产权的',
        ja: '• 知的財産権を侵害するもの'
      },
      section3Title: {
        en: '3. User Conduct',
        es: '3. Conducta del Usuario',
        zh: '3. 用户行为',
        ja: '3. ユーザー行動'
      },
      section3Text: {
        en: 'Users must:',
        es: 'Los usuarios deben:',
        zh: '用户必须：',
        ja: 'ユーザーは以下を守る必要があります：'
      },
      conduct1: {
        en: '• Treat other users with respect',
        es: '• Tratar a otros usuarios con respeto',
        zh: '• 尊重其他用户',
        ja: '• 他のユーザーを尊重すること'
      },
      conduct2: {
        en: '• Use the app for its intended purpose (language exchange)',
        es: '• Usar la aplicación para su propósito previsto (intercambio de idiomas)',
        zh: '• 按预期目的使用应用程序（语言交流）',
        ja: '• 本アプリを本来の目的（言語交換）で使用すること'
      },
      conduct3: {
        en: '• Not impersonate others',
        es: '• No hacerse pasar por otros',
        zh: '• 不冒充他人',
        ja: '• 他人になりすまさないこと'
      },
      conduct4: {
        en: '• Be cautious when sharing personal information',
        es: '• Ser cauteloso al compartir información personal',
        zh: '• 分享个人信息时要谨慎',
        ja: '• 個人情報の共有には注意すること'
      },
      conduct5: {
        en: '• Not attempt to hack or disrupt the service',
        es: '• No intentar hackear o interrumpir el servicio',
        zh: '• 不得试图破坏或干扰服务',
        ja: '• サービスのハッキングや妨害を試みないこと'
      },
      section4Title: {
        en: '4. Content Moderation',
        es: '4. Moderación de Contenido',
        zh: '4. 内容审核',
        ja: '4. コンテンツの管理'
      },
      section4Text: {
        en: 'We reserve the right to:',
        es: 'Nos reservamos el derecho de:',
        zh: '我们保留以下权利：',
        ja: '私たちは以下の権利を保有します：'
      },
      moderation1: {
        en: '• Monitor and review user content',
        es: '• Monitorear y revisar el contenido del usuario',
        zh: '• 监控和审查用户内容',
        ja: '• ユーザーコンテンツを監視およびレビューすること'
      },
      moderation2: {
        en: '• Remove objectionable content immediately',
        es: '• Eliminar contenido objetable de inmediato',
        zh: '• 立即删除不当内容',
        ja: '• 不適切なコンテンツを直ちに削除すること'
      },
      moderation3: {
        en: '• Suspend or terminate accounts that violate these terms',
        es: '• Suspender o terminar cuentas que violen estos términos',
        zh: '• 暂停或终止违反这些条款的账户',
        ja: '• 本規約に違反するアカウントを停止または削除すること'
      },
      section5Title: {
        en: '5. Reporting and Blocking',
        es: '5. Reportar y Bloquear',
        zh: '5. 举报和屏蔽',
        ja: '5. 報告とブロック'
      },
      section5Text: {
        en: 'Users can:',
        es: 'Los usuarios pueden:',
        zh: '用户可以：',
        ja: 'ユーザーは以下ができます：'
      },
      reporting1: {
        en: '• Report inappropriate content or behavior',
        es: '• Reportar contenido o comportamiento inapropiado',
        zh: '• 举报不当内容或行为',
        ja: '• 不適切なコンテンツや行動を報告すること'
      },
      reporting2: {
        en: '• Block users to prevent further communication',
        es: '• Bloquear usuarios para evitar más comunicación',
        zh: '• 屏蔽用户以防止进一步沟通',
        ja: '• ユーザーをブロックしてさらなる連絡を防ぐこと'
      },
      reporting3: {
        en: '• Contact us at jihun.jo@yahoo.com for urgent issues',
        es: '• Contáctenos en jihun.jo@yahoo.com para problemas urgentes',
        zh: '• 紧急问题请联系 jihun.jo@yahoo.com',
        ja: '• 緊急の問題については jihun.jo@yahoo.com にご連絡ください'
      },
      section5Commitment: {
        en: 'We are committed to reviewing all reports within 24 hours and taking appropriate action, including removing objectionable content and suspending or terminating accounts of users who violate these terms.',
        es: 'Nos comprometemos a revisar todos los informes dentro de 24 horas y tomar las medidas apropiadas, incluyendo eliminar contenido objetable y suspender o terminar cuentas de usuarios que violen estos términos.',
        zh: '我们承诺在24小时内审查所有举报，并采取适当行动，包括删除不当内容以及暂停或终止违反这些条款的用户账户。',
        ja: '私たちは、すべての報告を24時間以内に審査し、不適切なコンテンツの削除や本規約に違反するユーザーのアカウントの停止または削除を含む適切な措置を講じることをお約束します。'
      },
      section6Title: {
        en: '6. Consequences of Violations',
        es: '6. Consecuencias de las Violaciones',
        zh: '6. 违规后果',
        ja: '6. 違反の結果'
      },
      section6Text: {
        en: 'Violations may result in:',
        es: 'Las violaciones pueden resultar en:',
        zh: '违规可能导致：',
        ja: '違反は以下の結果をもたらす可能性があります：'
      },
      consequence1: {
        en: '• Warning from moderators',
        es: '• Advertencia de los moderadores',
        zh: '• 版主警告',
        ja: 'モデレーターからの警告'
      },
      consequence2: {
        en: '• Account suspension or ban',
        es: '• Suspensión o prohibición de cuenta',
        zh: '• 账户暂停或封禁',
        ja: 'アカウントの停止または禁止'
      },
      consequence3: {
        en: '• Account termination for serious violations',
        es: '• Terminación de cuenta por violaciones graves',
        zh: '• 严重违规账户终止',
        ja: '• 重大な違反の場合はアカウント削除'
      },
      consequence4: {
        en: '• Legal action if necessary',
        es: '• Acción legal si es necesario',
        zh: '• 必要时采取法律行动',
        ja: '• 必要に応じて法的措置'
      },
      section7Title: {
        en: '7. Contact',
        es: '7. Contacto',
        zh: '7. 联系方式',
        ja: '7. お問い合わせ'
      },
      section7Text: {
        en: 'For questions or concerns, contact us at: jihun.jo@yahoo.com',
        es: 'Para preguntas o inquietudes, contáctenos en: jihun.jo@yahoo.com',
        zh: '如有疑问或顾虑，请联系我们：jihun.jo@yahoo.com',
        ja: 'ご質問やご不明な点がございましたら、jihun.jo@yahoo.com までお問い合わせください'
      },
      checkboxText: {
        en: 'I agree to the Terms of Service',
        es: 'Acepto los Términos de Servicio',
        zh: '我同意服务条款',
        ja: '利用規約に同意します'
      },
      acceptButton: {
        en: 'Accept and Continue',
        es: 'Aceptar y Continuar',
        zh: '接受并继续',
        ja: '同意して続ける'
      },
      errorTitle: {
        en: 'Error',
        es: 'Error',
        zh: '错误',
        ja: 'エラー'
      },
      errorMessage: {
        en: 'Please agree to the Terms of Service to continue.',
        es: 'Por favor acepte los Términos de Servicio para continuar.',
        zh: '请同意服务条款以继续。',
        ja: '続行するには利用規約に同意してください。'
      }
    };
    return translations[key]?.[language] || translations[key]?.en || '';
  };

  const handleAccept = () => {
    if (!agreed) {
      Alert.alert(
        getTranslation('errorTitle'),
        getTranslation('errorMessage')
      );
      return;
    }
    if (onAccept) {
      onAccept();
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>{getTranslation('title')}</Text>
        <Text style={styles.lastUpdated}>{getTranslation('lastUpdated')}</Text>

        <Text style={styles.sectionTitle}>{getTranslation('section1Title')}</Text>
        <Text style={styles.text}>{getTranslation('section1Text')}</Text>

        <Text style={styles.sectionTitle}>{getTranslation('section2Title')}</Text>
        <Text style={styles.text}>{getTranslation('section2Text')}</Text>
        <Text style={styles.bullet}>{getTranslation('prohibited1')}</Text>
        <Text style={styles.bullet}>{getTranslation('prohibited2')}</Text>
        <Text style={styles.bullet}>{getTranslation('prohibited3')}</Text>
        <Text style={styles.bullet}>{getTranslation('prohibited4')}</Text>
        <Text style={styles.bullet}>{getTranslation('prohibited5')}</Text>
        <Text style={styles.bullet}>{getTranslation('prohibited6')}</Text>

        <Text style={styles.sectionTitle}>{getTranslation('section3Title')}</Text>
        <Text style={styles.text}>{getTranslation('section3Text')}</Text>
        <Text style={styles.bullet}>{getTranslation('conduct1')}</Text>
        <Text style={styles.bullet}>{getTranslation('conduct2')}</Text>
        <Text style={styles.bullet}>{getTranslation('conduct3')}</Text>
        <Text style={styles.bullet}>{getTranslation('conduct4')}</Text>
        <Text style={styles.bullet}>{getTranslation('conduct5')}</Text>

        <Text style={styles.sectionTitle}>{getTranslation('section4Title')}</Text>
        <Text style={styles.text}>{getTranslation('section4Text')}</Text>
        <Text style={styles.bullet}>{getTranslation('moderation1')}</Text>
        <Text style={styles.bullet}>{getTranslation('moderation2')}</Text>
        <Text style={styles.bullet}>{getTranslation('moderation3')}</Text>

        <Text style={styles.sectionTitle}>{getTranslation('section5Title')}</Text>
        <Text style={styles.text}>{getTranslation('section5Text')}</Text>
        <Text style={styles.bullet}>{getTranslation('reporting1')}</Text>
        <Text style={styles.bullet}>{getTranslation('reporting2')}</Text>
        <Text style={styles.bullet}>{getTranslation('reporting3')}</Text>
        <Text style={styles.text}>{getTranslation('section5Commitment')}</Text>

        <Text style={styles.sectionTitle}>{getTranslation('section6Title')}</Text>
        <Text style={styles.text}>{getTranslation('section6Text')}</Text>
        <Text style={styles.bullet}>{getTranslation('consequence1')}</Text>
        <Text style={styles.bullet}>{getTranslation('consequence2')}</Text>
        <Text style={styles.bullet}>{getTranslation('consequence3')}</Text>
        <Text style={styles.bullet}>{getTranslation('consequence4')}</Text>

        <Text style={styles.sectionTitle}>{getTranslation('section7Title')}</Text>
        <Text style={styles.text}>{getTranslation('section7Text')}</Text>

        <View style={styles.spacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setAgreed(!agreed)}
        >
          <View style={[styles.checkboxBox, agreed && styles.checkboxBoxChecked]}>
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxText}>
            {getTranslation('checkboxText')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !agreed && styles.buttonDisabled]}
          onPress={handleAccept}
          disabled={!agreed}
        >
          <Text style={styles.buttonText}>{getTranslation('acceptButton')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2196F3',
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 10,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginLeft: 10,
    marginBottom: 5,
  },
  spacer: {
    height: 100,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#2196F3',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TermsScreen;
