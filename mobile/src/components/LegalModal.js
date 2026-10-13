import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform
} from 'react-native';
import {
  Shield,
  FileText,
  X,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Mail,
  CheckCircle2
} from 'lucide-react-native';
import { PRODUCTION_HOST } from '../api/config';

const APP_NAME = 'GameLoot';
const COMPANY_NAME = 'GameLoot Interactive';
const LAST_UPDATED = 'October 13, 2026';
const PRIVACY_EMAIL = 'privacy@gameloot.app';
const SUPPORT_EMAIL = 'support@gameloot.app';

const PRIVACY_SECTIONS = [
  {
    id: 'intro',
    title: '1. Introduction',
    content: `Welcome to ${APP_NAME} ("we", "our", or "us"). We are committed to protecting your personal privacy while providing a fun and rewarding play-to-earn HTML5 mobile gaming platform. This Privacy Policy details the types of information we collect when you download, install, or use the ${APP_NAME} mobile application and website, how we use, share, and protect that information, and your rights regarding your personal data.`
  },
  {
    id: 'data-collected',
    title: '2. Information We Collect',
    content: `We collect information necessary to operate our loyalty reward platform, enforce fair play anti-cheat standards, and process legitimate reward redemptions:`,
    subsections: [
      {
        title: 'A. Account Information',
        content: `When you create an account, register via email, or log in with Google, we collect your username, email address, password hash, and optional profile avatar. When requesting cashout redemptions, we collect your verified payout details (e.g. PayPal email).`
      },
      {
        title: 'B. Proof-of-Play & Gameplay Telemetry',
        content: `To calculate and grant promotional loyalty points (PTS), we collect session heartbeat pings, elapsed play duration, scores, streak activity, and spin wheel participation to protect against automated fraud.`
      },
      {
        title: 'C. Device & Technical Telemetry',
        content: `We collect device identifiers, operating system version (e.g. Android), device model, IP address, approximate geographical region, and app version for crash diagnostics and anti-bot verification.`
      }
    ]
  },
  {
    id: 'admob',
    title: '3. Advertising & Google AdMob Disclosure',
    content: `${APP_NAME} is an ad-supported loyalty platform. We partner with Google AdMob (Google Play Services) to display rewarded video ads, banner ads, and sponsored partner drops. Google AdMob may use device advertising identifiers (such as the Google Advertising ID / GAID) and cookies to serve contextual or personalized advertisements in accordance with Google's Privacy Policy. You can inspect and manage your Google Ad settings or reset your Advertising ID anytime in your Android Device Settings > Google > Ads.`
  },
  {
    id: 'usage',
    title: '4. How We Use Your Information',
    content: `We process your data strictly for legitimate operational purposes:`,
    bullets: [
      'Authenticating your account and synchronizing points balance across sessions.',
      'Auditing gameplay duration with proof-of-play anti-cheat checks before points conversion.',
      'Processing legitimate cashout and reward redemption requests within our 24–72 hour verification window.',
      'Serving sponsored video rewards and promotional loyalty drops.',
      'Broadcasting real-time bonus notifications, streak reminders, and app update alerts.',
      'Preventing fraud, multiple accounts, automated bot emulators, and terms violations.'
    ]
  },
  {
    id: 'sharing',
    title: '5. Sharing & Disclosure of Data',
    content: `We do not sell, rent, or trade your personal information to third parties. We may share data strictly in the following limited circumstances:`,
    bullets: [
      'With trusted cloud hosting and database service providers operating under strict confidentiality.',
      'With payout processors (e.g., PayPal) solely to execute requested user cashouts.',
      'With Google AdMob to deliver rewarded video ads and verify ad completion nonces.',
      'To comply with valid legal processes, court orders, or law enforcement investigations.'
    ]
  },
  {
    id: 'retention-deletion',
    title: '6. Account & Data Deletion (Google Play Compliance)',
    content: `In accordance with Google Play Developer Policy and global privacy standards (GDPR / CCPA):`,
    bullets: [
      'You have the right to request the permanent deletion of your account and all associated personal data at any time.',
      'To request account deletion, navigate to Settings > Account > Delete Account in the mobile app, or email us at privacy@gameloot.app with your registered email and username.',
      'Upon verification, all account records, gameplay histories, and personal identifiers will be permanently purged from our active databases within 30 days.'
    ]
  },
  {
    id: 'security',
    title: '7. Data Security',
    content: `We employ strict security measures including TLS/SSL encryption for all data in transit, encrypted password hashing (bcrypt), tokenized JWT authentication, and automated rate limiting to protect against unauthorized access, alteration, or disclosure.`
  },
  {
    id: 'children',
    title: "8. Children's Privacy (COPPA Compliance)",
    content: `${APP_NAME} is intended for general audiences aged 13 and older (or 16 and older in the European Economic Area). We do not knowingly collect or solicit personal data from children under 13. If we discover that personal information has been collected from a child under 13, we promptly delete such data from our servers.`
  },
  {
    id: 'contact',
    title: '9. Contact Us',
    content: `If you have questions, feedback, or data privacy requests concerning this Privacy Policy, please contact our Data Protection Officer at: ${PRIVACY_EMAIL}`
  }
];

const TERMS_SECTIONS = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `By downloading, installing, accessing, or using the ${APP_NAME} mobile application or services, you agree to be legally bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must immediately uninstall and cease all use of the application.`
  },
  {
    id: 'eligibility',
    title: '2. User Eligibility & Account Integrity',
    content: `You must be at least 13 years of age (or the minimum legal age required in your jurisdiction) to use ${APP_NAME}. You agree to:`,
    bullets: [
      'Maintain only one (1) account per individual. Operating duplicate, alternate, or bot accounts is strictly prohibited.',
      'Provide accurate, current registration details and keep your login credentials confidential.',
      'Accept full responsibility for all activities occurring under your account credentials.'
    ]
  },
  {
    id: 'rewards-system',
    title: '3. Promotional Reward Points (PTS) & Redemptions',
    content: `The reward points ("PTS") awarded within ${APP_NAME} are promotional loyalty points provided as voluntary engagement incentives:`,
    bullets: [
      'Points have no intrinsic monetary or real-world property value and cannot be transferred, sold, or bartered outside the application.',
      'Points may only be redeemed for available gift cards or cashout options published in the in-app Rewards Catalog, subject to meeting published minimum withdrawal thresholds.',
      'All redemption requests undergo automated and manual anti-fraud review before payout approval (typically processed within 24 to 72 business hours).',
      'Users are solely responsible for all applicable personal income taxes, reporting, and transaction fees associated with received payouts.'
    ]
  },
  {
    id: 'fair-play',
    title: '4. Fair Play, Anti-Cheat & Prohibited Conduct',
    content: `To safeguard our platform and advertising partners, ${APP_NAME} enforces a zero-tolerance Fair Play Policy. You expressly agree NOT to:`,
    bullets: [
      'Use automated scripts, clickers, bots, macro recorders, or memory modifiers.',
      'Manipulate proof-of-play heartbeat pings, session timers, or API request payloads.',
      'Employ VPNs, proxy networks, or device spoofing software to circumvent geographic ad rules or artificially multiply rewards.',
      'Decompile, reverse-engineer, modify, or disassemble the application binaries or game webviews.',
      'Engage in fraudulent ad clicks, automated video skipping, or artificial ad impression generation.'
    ]
  },
  {
    id: 'termination',
    title: '5. Account Suspension & Forfeiture',
    content: `We reserve the unilateral right to suspend, terminate, or ban any account without prior notice if we detect suspicious telemetry, anti-cheat violations, automated script activity, or breach of these Terms. Any unredeemed points in a banned or fraudulent account will be permanently forfeited.`
  },
  {
    id: 'games-ip',
    title: '6. Third-Party Games & Intellectual Property',
    content: `The HTML5 games featured in ${APP_NAME} are either licensed, public domain, or curated from authorized web game developers. All game trademarks, assets, and copyrights remain the exclusive property of their respective creators. ${APP_NAME} trademarks, graphics, UI design, and backend systems are protected proprietary intellectual property.`
  },
  {
    id: 'disclaimer',
    title: '7. Disclaimer of Warranties & Limitation of Liability',
    content: `${APP_NAME} is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. To the maximum extent permitted by applicable law, ${COMPANY_NAME} shall not be liable for any indirect, incidental, punitive, or consequential damages arising from app usage, payout delays, third-party game availability, or service interruptions.`
  },
  {
    id: 'modifications',
    title: '8. Modifications to Terms',
    content: `We reserve the right to revise these Terms at any time. Changes will become effective upon publishing the updated Terms with a revised "Last Updated" date. Your continued use of the application after changes constitute acceptance of the updated terms.`
  },
  {
    id: 'contact',
    title: '9. Contact & Support',
    content: `If you have questions or inquiries regarding these Terms of Service, please reach out to our team at: ${SUPPORT_EMAIL}`
  }
];

export default function LegalModal({
  visible,
  onClose,
  initialTab = 'privacy',
  isDark = true
}) {
  const [tab, setTab] = useState(initialTab);

  const isPrivacy = tab === 'privacy';
  const sections = isPrivacy ? PRIVACY_SECTIONS : TERMS_SECTIONS;
  const docTitle = isPrivacy ? 'Privacy Policy' : 'Terms of Service';

  const host = PRODUCTION_HOST || 'https://gameloot.youplex.cc';

  const handleOpenBrowser = () => {
    const url = `${host}/${isPrivacy ? 'privacy' : 'terms'}`;
    Linking.openURL(url).catch(() => {});
  };

  const bg = isDark ? '#090d16' : '#ffffff';
  const cardBg = isDark ? '#111827' : '#f8fafc';
  const subBg = isDark ? '#0b1120' : '#f1f5f9';
  const border = isDark ? '#1f293d' : '#e2e8f0';
  const text = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Top Header Bar */}
        <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: border }]}>
          {/* Segmented Pill */}
          <View style={[styles.pillContainer, { backgroundColor: subBg, borderColor: border }]}>
            <TouchableOpacity
              style={[
                styles.pillBtn,
                isPrivacy && styles.pillBtnActive
              ]}
              onPress={() => setTab('privacy')}
              activeOpacity={0.8}
            >
              <Shield size={13} color={isPrivacy ? '#090d16' : textMuted} />
              <Text style={[styles.pillText, isPrivacy ? styles.pillTextActive : { color: textMuted }]}>
                Privacy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pillBtn,
                !isPrivacy && styles.pillBtnActive
              ]}
              onPress={() => setTab('terms')}
              activeOpacity={0.8}
            >
              <FileText size={13} color={!isPrivacy ? '#090d16' : textMuted} />
              <Text style={[styles.pillText, !isPrivacy ? styles.pillTextActive : { color: textMuted }]}>
                Terms
              </Text>
            </TouchableOpacity>
          </View>

          {/* Right Action Controls */}
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: subBg, borderColor: border }]}
              onPress={handleOpenBrowser}
              activeOpacity={0.7}
            >
              <ExternalLink size={16} color="#06b6d4" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: subBg, borderColor: border }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={18} color={text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Document Content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
        >
          {/* Title Banner */}
          <View style={styles.heroSection}>
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeText}>Public Legal Statement • No Login Required</Text>
            </View>
            <Text style={[styles.docHeading, { color: text }]}>{docTitle}</Text>
            <Text style={[styles.docSub, { color: textMuted }]}>
              {isPrivacy
                ? 'Official Google Play & AdMob compliant disclosure regarding data collection, advertising identifiers, and user privacy rights.'
                : 'Platform rules, fair play standards, promotional points terms, and redemption policies.'}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: textMuted }]}>Last Updated: {LAST_UPDATED}</Text>
              <Text style={[styles.metaDot, { color: textMuted }]}>•</Text>
              <Text style={[styles.metaText, { color: textMuted }]}>Platform: GameLoot Mobile</Text>
            </View>
          </View>

          {/* Key Compliance Card */}
          <View style={[styles.complianceCard, { backgroundColor: isDark ? 'rgba(6, 182, 212, 0.08)' : '#f0fdf4', borderColor: isDark ? 'rgba(6, 182, 212, 0.25)' : '#bbf7d0' }]}>
            <CheckCircle2 size={18} color="#06b6d4" style={{ marginTop: 2 }} />
            <Text style={[styles.complianceText, { color: isDark ? '#cbd5e1' : '#1e293b' }]}>
              {isPrivacy
                ? 'GameLoot is an ad-funded platform. Points represent loyalty rewards from advertising revenue share. We do not sell personal data. You may request account deletion at any time.'
                : 'Zero tolerance for automated bots or emulator exploits. Every reward redemption undergoes automated proof-of-play checks for honest payouts.'}
            </Text>
          </View>

          {/* Sections List */}
          {sections.map((section, idx) => (
            <View
              key={section.id || idx}
              style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: border }]}
            >
              <Text style={[styles.sectionTitle, { color: text }]}>
                {section.title}
              </Text>

              {section.content && (
                <Text style={[styles.sectionContent, { color: textMuted }]}>
                  {section.content}
                </Text>
              )}

              {/* Subsections */}
              {section.subsections && section.subsections.map((sub, sIdx) => (
                <View key={sIdx} style={[styles.subCard, { backgroundColor: subBg, borderColor: border }]}>
                  <Text style={styles.subTitle}>{sub.title}</Text>
                  <Text style={[styles.subContent, { color: textMuted }]}>{sub.content}</Text>
                </View>
              ))}

              {/* Bullet Points */}
              {section.bullets && section.bullets.map((bullet, bIdx) => (
                <View key={bIdx} style={styles.bulletRow}>
                  <ChevronRight size={14} color="#06b6d4" style={styles.bulletIcon} />
                  <Text style={[styles.bulletText, { color: textMuted }]}>{bullet}</Text>
                </View>
              ))}
            </View>
          ))}

          {/* Account Deletion Notice (for Privacy) */}
          {isPrivacy && (
            <View style={[styles.deleteNoticeCard, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2', borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#fecaca' }]}>
              <AlertTriangle size={18} color="#ef4444" style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.deleteNoticeTitle}>Account Deletion (Google Play Compliance)</Text>
                <Text style={[styles.deleteNoticeText, { color: textMuted }]}>
                  You have the right to request the permanent deletion of your account and personal data at any time. Simply use Settings &gt; Delete Account in the app or email us at {PRIVACY_EMAIL}.
                </Text>
              </View>
            </View>
          )}

          {/* Bottom Close Action */}
          <TouchableOpacity
            style={[styles.bottomCloseBtn, { backgroundColor: '#06b6d4' }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.bottomCloseText}>Close Legal Document</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 54,
    paddingBottom: 12,
    borderBottomWidth: 1
  },
  pillContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9
  },
  pillBtnActive: {
    backgroundColor: '#06b6d4'
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700'
  },
  pillTextActive: {
    color: '#090d16',
    fontWeight: '800'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  heroSection: {
    marginBottom: 16
  },
  badgeWrap: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8
  },
  badgeText: {
    color: '#06b6d4',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  docHeading: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  docSub: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8
  },
  metaText: {
    fontSize: 11
  },
  metaDot: {
    fontSize: 11
  },
  complianceCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    gap: 10
  },
  complianceText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6
  },
  sectionContent: {
    fontSize: 13,
    lineHeight: 19
  },
  subCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginTop: 10
  },
  subTitle: {
    color: '#06b6d4',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3
  },
  subContent: {
    fontSize: 12,
    lineHeight: 17
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6
  },
  bulletIcon: {
    marginRight: 6,
    marginTop: 2
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17
  },
  deleteNoticeCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginVertical: 12
  },
  deleteNoticeTitle: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3
  },
  deleteNoticeText: {
    fontSize: 12,
    lineHeight: 17
  },
  bottomCloseBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  bottomCloseText: {
    color: '#090d16',
    fontSize: 14,
    fontWeight: '800'
  }
});
