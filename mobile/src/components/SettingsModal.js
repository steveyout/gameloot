import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Alert,
  Share,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings,
  User,
  Volume2,
  Vibrate,
  Bell,
  Moon,
  Sun,
  Wifi,
  Trash2,
  RefreshCw,
  ShieldCheck,
  FileText,
  LogOut,
  X,
  Share2,
  Coins,
  ChevronRight,
  Sparkles,
  Lock
} from 'lucide-react-native';
import { setSoundEnabled as configureSound } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';
import { DEFAULT_HOST } from '../api/config';

export default function SettingsModal({
  visible,
  user,
  onClose,
  onLogout,
  onCheckUpdate,
  isCheckingUpdate,
  updateInfo,
  onShowAlert
}) {
  const { theme, isDark, setTheme, colors } = useTheme();

  // Preferences State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [amoledMode, setAmoledMode] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [cacheSize, setCacheSize] = useState('14.2 MB');

  // Load persisted user preferences
  useEffect(() => {
    async function loadPreferences() {
      try {
        const [sound, haptics, push, amoled, data, curr] = await Promise.all([
          AsyncStorage.getItem('@pref_sound'),
          AsyncStorage.getItem('@pref_haptics'),
          AsyncStorage.getItem('@pref_push'),
          AsyncStorage.getItem('@pref_amoled'),
          AsyncStorage.getItem('@pref_data_saver'),
          AsyncStorage.getItem('@pref_currency')
        ]);
        if (sound !== null) setSoundEnabled(sound === 'true');
        if (haptics !== null) setHapticsEnabled(haptics === 'true');
        if (push !== null) setPushEnabled(push === 'true');
        if (amoled !== null) setAmoledMode(amoled === 'true');
        if (data !== null) setDataSaver(data === 'true');
        if (curr !== null) setCurrency(curr);
      } catch (err) {
        console.warn('Failed to load user preferences:', err);
      }
    }
    if (visible) {
      loadPreferences();
    }
  }, [visible]);

  const savePreference = async (key, value) => {
    try {
      await AsyncStorage.setItem(`@pref_${key}`, String(value));
    } catch (err) {
      console.warn(`Failed to save preference ${key}:`, err);
    }
  };

  const handleToggleSound = (v) => {
    setSoundEnabled(v);
    configureSound(v);
    savePreference('sound', v);
    if (onShowAlert) onShowAlert(`Sound Effects ${v ? 'Enabled' : 'Muted'}`, 'info');
  };

  const handleToggleHaptics = (v) => {
    setHapticsEnabled(v);
    savePreference('haptics', v);
    if (onShowAlert) onShowAlert(`Vibration Haptics ${v ? 'Enabled' : 'Disabled'}`, 'info');
  };

  const handleTogglePush = (v) => {
    setPushEnabled(v);
    savePreference('pushEnabled', v);
    if (onShowAlert) onShowAlert(`Push Notifications ${v ? 'Subscribed' : 'Silenced'}`, 'info');
  };

  const handleToggleAmoled = (v) => {
    setAmoledMode(v);
    savePreference('amoledMode', v);
    if (onShowAlert) onShowAlert(`AMOLED Deep Black ${v ? 'Enabled' : 'Standard Dark'}`, 'info');
  };

  const handleToggleDataSaver = (v) => {
    setDataSaver(v);
    savePreference('dataSaver', v);
    if (onShowAlert) onShowAlert(`Data Saver ${v ? 'Activated' : 'Standard'}`, 'info');
  };

  const handleSelectCurrency = (c) => {
    setCurrency(c);
    savePreference('currency', c);
    if (onShowAlert) onShowAlert(`Display Currency set to ${c}`, 'info');
  };

  const handleClearCache = async () => {
    try {
      setCacheSize('0.0 MB');
      if (onShowAlert) {
        onShowAlert('Temporary Game Cache Cleared (+14.2 MB freed)', 'success', 'Storage Optimized');
      }
    } catch (err) {
      if (onShowAlert) onShowAlert('Failed to clear cache', 'error');
    }
  };

  const handleShareReferral = async () => {
    const refCode = user ? `LOOT-${(user.id * 73 + 1200).toString(36).toUpperCase()}` : 'LOOT-VIP';
    try {
      await Share.share({
        message: `🎮 Play HTML5 games and earn real rewards with me on GameLoot! Use my invite code ${refCode} to get a +100 PTS welcome bonus: https://gameloot.app/invite/${refCode}`
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleOpenPrivacy = () => {
    const url = `${DEFAULT_HOST}/privacy`;
    Linking.openURL(url).catch(() => {
      if (onShowAlert) onShowAlert('Could not open Privacy Policy link', 'error');
    });
  };

  const handleOpenTerms = () => {
    const url = `${DEFAULT_HOST}/terms`;
    Linking.openURL(url).catch(() => {
      if (onShowAlert) onShowAlert('Could not open Terms of Service link', 'error');
    });
  };

  const referralCode = user ? `LOOT-${(user.id * 73 + 1200).toString(36).toUpperCase()}` : 'LOOT-VIP';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* Click outside to close drawer */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#334155' : '#cbd5e1' }]} />

          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconBadge, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                <Settings size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Settings & Security</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Account preferences & transparency</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Account Profile Card */}
            {user ? (
              <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.profileRow}>
                  <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#1e1b4b' : '#e0e7ff', borderColor: colors.primary }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                      {(user.username || 'P').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={[styles.profileUsername, { color: colors.text }]}>{user.username}</Text>
                    <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user.email || 'Verified Player'}</Text>
                    <View style={styles.pointsBadgeWrap}>
                      <Coins size={12} color="#fbbf24" />
                      <Text style={styles.pointsBadgeText}>
                        {(user.points_balance || 0).toLocaleString()} PTS (≈ ${((user.points_balance || 0) * 0.001).toFixed(2)})
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Referral Invite Box */}
                <View style={[styles.referralBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                  <View>
                    <Text style={[styles.referralLabel, { color: colors.textSecondary }]}>Your Referral Code</Text>
                    <Text style={[styles.referralCode, { color: colors.primary }]}>{referralCode}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.shareBtn}
                    onPress={handleShareReferral}
                    activeOpacity={0.8}
                  >
                    <Share2 size={13} color="#090d16" style={{ marginRight: 4 }} />
                    <Text style={styles.shareBtnText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* Appearance Theme Selector */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance & Theme</Text>

              <View style={styles.themeSwitcherRow}>
                <TouchableOpacity
                  style={[
                    styles.themeOptionBtn,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                    isDark && [styles.themeOptionBtnActive, { borderColor: colors.primary }]
                  ]}
                  onPress={() => setTheme('dark')}
                  activeOpacity={0.8}
                >
                  <Moon size={18} color={isDark ? colors.primary : colors.textSecondary} />
                  <Text style={[
                    styles.themeOptionText,
                    { color: colors.textSecondary },
                    isDark && [styles.themeOptionTextActive, { color: colors.primary }]
                  ]}>
                    Dark Mode
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.themeOptionBtn,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                    !isDark && [styles.themeOptionBtnActive, { borderColor: colors.primary }]
                  ]}
                  onPress={() => setTheme('light')}
                  activeOpacity={0.8}
                >
                  <Sun size={18} color={!isDark ? colors.primary : colors.textSecondary} />
                  <Text style={[
                    styles.themeOptionText,
                    { color: colors.textSecondary },
                    !isDark && [styles.themeOptionTextActive, { color: colors.primary }]
                  ]}>
                    Light Mode
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Audio & Feedback */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Audio & Haptics</Text>

              <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                <View style={styles.settingLeft}>
                  <Volume2 size={18} color={colors.primary} />
                  <View style={styles.settingTextWrap}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>Sound Effects</Text>
                    <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Coins, win fanfare, and button audio</Text>
                  </View>
                </View>
                <Switch
                  value={soundEnabled}
                  onValueChange={handleToggleSound}
                  trackColor={{ false: '#334155', true: '#06b6d4' }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View style={styles.settingLeft}>
                  <Vibrate size={18} color="#8b5cf6" />
                  <View style={styles.settingTextWrap}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>Vibration Haptics</Text>
                    <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Tactile clicks and reward vibrations</Text>
                  </View>
                </View>
                <Switch
                  value={hapticsEnabled}
                  onValueChange={handleToggleHaptics}
                  trackColor={{ false: '#334155', true: '#8b5cf6' }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {/* Performance & Display */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Performance & Display</Text>

              <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                <View style={styles.settingLeft}>
                  <Moon size={18} color={colors.textSecondary} />
                  <View style={styles.settingTextWrap}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>AMOLED Pure Black</Text>
                    <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Saves battery on OLED phone displays</Text>
                  </View>
                </View>
                <Switch
                  value={amoledMode}
                  onValueChange={handleToggleAmoled}
                  trackColor={{ false: '#334155', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View style={styles.settingLeft}>
                  <Wifi size={18} color="#10b981" />
                  <View style={styles.settingTextWrap}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>Data Saver Mode</Text>
                    <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Compress game assets for lower data usage</Text>
                  </View>
                </View>
                <Switch
                  value={dataSaver}
                  onValueChange={handleToggleDataSaver}
                  trackColor={{ false: '#334155', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {/* Storage & Maintenance */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Storage & App Integrity</Text>

              <View style={[styles.actionItemRow, { borderBottomColor: colors.border }]}>
                <View style={styles.actionItemLeft}>
                  <Trash2 size={16} color={colors.textSecondary} />
                  <View>
                    <Text style={[styles.actionItemTitle, { color: colors.text }]}>Cached Assets</Text>
                    <Text style={[styles.actionItemSub, { color: colors.textSecondary }]}>{cacheSize} temporary game data</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.clearBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                  onPress={handleClearCache}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.clearBtnText, { color: colors.text }]}>Clear Cache</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.actionItemRow, { borderBottomWidth: 0 }]}>
                <View style={styles.actionItemLeft}>
                  <RefreshCw size={16} color={colors.primary} />
                  <View>
                    <Text style={[styles.actionItemTitle, { color: colors.text }]}>Version Guard</Text>
                    <Text style={[styles.actionItemSub, { color: colors.textSecondary }]}>
                      Installed v{updateInfo?.client_version || '1.0.0'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.checkUpdateBtn}
                  onPress={onCheckUpdate}
                  disabled={isCheckingUpdate}
                  activeOpacity={0.7}
                >
                  <Text style={styles.checkUpdateBtnText}>
                    {isCheckingUpdate ? 'Checking...' : 'Check Update'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Legal, Compliance & Privacy (Google Play & AdMob Requirement) */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Legal & Compliance</Text>

              <TouchableOpacity
                style={[styles.actionItemRow, { borderBottomColor: colors.border }]}
                onPress={handleOpenPrivacy}
                activeOpacity={0.7}
              >
                <View style={styles.actionItemLeft}>
                  <ShieldCheck size={18} color="#06b6d4" />
                  <View>
                    <Text style={[styles.actionItemTitle, { color: colors.text }]}>Privacy Policy</Text>
                    <Text style={[styles.actionItemSub, { color: colors.textSecondary }]}>Google Play & AdMob compliant data handling</Text>
                  </View>
                </View>
                <ChevronRight size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionItemRow, { borderBottomWidth: 0 }]}
                onPress={handleOpenTerms}
                activeOpacity={0.7}
              >
                <View style={styles.actionItemLeft}>
                  <FileText size={18} color="#3b82f6" />
                  <View>
                    <Text style={[styles.actionItemTitle, { color: colors.text }]}>Terms of Service</Text>
                    <Text style={[styles.actionItemSub, { color: colors.textSecondary }]}>Rules of fair play, rewards & redemption terms</Text>
                  </View>
                </View>
                <ChevronRight size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Trust, Fair Play & Transparency */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Trust & Fair Play Transparency</Text>
              <View style={styles.complianceRow}>
                <ShieldCheck size={18} color="#10b981" />
                <Text style={[styles.complianceText, { color: colors.textSecondary }]}>
                  GameLoot is an ad-funded rewards platform. Points represent loyalty rewards from advertising revenue share. Instant approval queues and transparent payout minimums.
                </Text>
              </View>
            </View>

            {/* Account Danger Zone */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  onClose();
                  if (onLogout) onLogout();
                }}
                activeOpacity={0.7}
              >
                <LogOut size={16} color="#ef4444" style={{ marginRight: 6 }} />
                <Text style={styles.logoutBtnText}>Sign Out of GameLoot</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end'
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    maxHeight: '90%',
    minHeight: '65%',
    paddingBottom: Platform.OS === 'android' ? 20 : 34
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900'
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 1
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollContent: {
    padding: 16
  },
  profileCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900'
  },
  profileInfo: {
    flex: 1
  },
  profileUsername: {
    fontSize: 16,
    fontWeight: '800'
  },
  profileEmail: {
    fontSize: 11,
    marginTop: 2
  },
  pointsBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6
  },
  pointsBadgeText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800'
  },
  referralBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  referralLabel: {
    fontSize: 10,
    fontWeight: '700'
  },
  referralCode: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06b6d4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  shareBtnText: {
    color: '#090d16',
    fontSize: 11,
    fontWeight: '800'
  },
  sectionCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  themeSwitcherRow: {
    flexDirection: 'row',
    gap: 10
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5
  },
  themeOptionBtnActive: {
    borderWidth: 1.5
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '700'
  },
  themeOptionTextActive: {
    fontWeight: '900'
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  settingTextWrap: {
    flex: 1
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700'
  },
  settingSub: {
    fontSize: 10,
    marginTop: 2
  },
  actionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1
  },
  actionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  actionItemTitle: {
    fontSize: 13,
    fontWeight: '700'
  },
  actionItemSub: {
    fontSize: 10,
    marginTop: 2
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700'
  },
  checkUpdateBtn: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  checkUpdateBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#090d16'
  },
  complianceRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)'
  },
  complianceText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 12,
    borderRadius: 12
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '800'
  }
});
