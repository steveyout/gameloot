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
  Share
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

  useEffect(() => {
    loadSettings();
  }, [visible]);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('gameloot_user_preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.soundEnabled !== undefined) {
          setSoundEnabled(parsed.soundEnabled);
          configureSound(parsed.soundEnabled);
        }
        if (parsed.hapticsEnabled !== undefined) setHapticsEnabled(parsed.hapticsEnabled);
        if (parsed.pushEnabled !== undefined) setPushEnabled(parsed.pushEnabled);
        if (parsed.amoledMode !== undefined) setAmoledMode(parsed.amoledMode);
        if (parsed.dataSaver !== undefined) setDataSaver(parsed.dataSaver);
        if (parsed.currency) setCurrency(parsed.currency);
      }
    } catch (err) {
      console.warn('Error loading preferences:', err);
    }
  };

  const savePreference = async (key, value) => {
    try {
      const saved = await AsyncStorage.getItem('gameloot_user_preferences');
      const current = saved ? JSON.parse(saved) : {};
      current[key] = value;
      await AsyncStorage.setItem('gameloot_user_preferences', JSON.stringify(current));
    } catch (err) {
      console.warn('Error saving preference:', err);
    }
  };

  const handleToggleSound = (v) => {
    setSoundEnabled(v);
    configureSound(v);
    savePreference('soundEnabled', v);
    if (onShowAlert) onShowAlert(`Game Audio & Sounds ${v ? 'Enabled' : 'Muted'}`, 'info');
  };

  const handleToggleHaptics = (v) => {
    setHapticsEnabled(v);
    savePreference('hapticsEnabled', v);
    if (onShowAlert) onShowAlert(`Haptic Feedback ${v ? 'Enabled' : 'Disabled'}`, 'info');
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

        <View style={[styles.modalSheet, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          <View style={styles.sheetHandle} />

          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.modalTitleRow}>
              <View style={styles.titleIconBadge}>
                <Settings size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>App Settings</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Preferences & Account Controls</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.settingsScroll} contentContainerStyle={styles.scrollContent}>
            {/* Theme & Appearance Switcher */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Theme & Appearance</Text>
              <View style={styles.themeRow}>
                <TouchableOpacity
                  style={[
                    styles.themeOptionBtn,
                    isDark && styles.themeOptionBtnActive,
                    { borderColor: isDark ? colors.primary : colors.border, backgroundColor: colors.surfaceSubtle }
                  ]}
                  onPress={() => setTheme('dark')}
                  activeOpacity={0.7}
                >
                  <Moon size={16} color={isDark ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.themeOptionText, { color: isDark ? colors.primary : colors.textSecondary }]}>
                    Dark Mode
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.themeOptionBtn,
                    !isDark && styles.themeOptionBtnActive,
                    { borderColor: !isDark ? colors.primary : colors.border, backgroundColor: colors.surfaceSubtle }
                  ]}
                  onPress={() => setTheme('light')}
                  activeOpacity={0.7}
                >
                  <Sun size={16} color={!isDark ? '#f59e0b' : colors.textSecondary} />
                  <Text style={[styles.themeOptionText, { color: !isDark ? '#d97706' : colors.textSecondary }]}>
                    Light Mode
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Player Identity Card */}
            {user ? (
              <LinearGradient
                colors={isDark ? ['#1e293b', '#0f172a'] : ['#e2e8f0', '#f8fafc']}
                style={[styles.profileCard, { borderColor: colors.borderStrong }]}
              >
                <View style={styles.profileRow}>
                  <View style={styles.avatarBadge}>
                    <Text style={styles.avatarLetter}>
                      {(user.username || 'P').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={[styles.profileUsername, { color: colors.text }]}>{user.username}</Text>
                    <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user.email || 'player@gameloot.com'}</Text>
                    <View style={styles.vipTag}>
                      <Sparkles size={11} color="#fbbf24" />
                      <Text style={styles.vipText}>Player ID #{user.id} • VIP Rank 1</Text>
                    </View>
                  </View>
                </View>

                {/* Referral Code Share Row */}
                <View style={[styles.referralBox, { borderTopColor: colors.border }]}>
                  <View>
                    <Text style={styles.referralLabel}>YOUR INVITE CODE</Text>
                    <Text style={styles.referralCode}>{referralCode}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.shareBtn}
                    onPress={handleShareReferral}
                    activeOpacity={0.8}
                  >
                    <Share2 size={13} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.shareBtnText}>Share & Earn +100</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            ) : null}

            {/* Display Currency */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Display Currency</Text>
              <View style={styles.currencyRow}>
                {['USD', 'EUR', 'GBP'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.currencyBtn,
                      currency === c && styles.currencyBtnActive,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }
                    ]}
                    onPress={() => handleSelectCurrency(c)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.currencyBtnText,
                      currency === c && styles.currencyBtnTextActive,
                      { color: currency === c ? colors.primary : colors.textSecondary }
                    ]}>
                      {c === 'USD' ? '$ USD' : c === 'EUR' ? '€ EUR' : '£ GBP'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Experience & Audio */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Experience & Audio</Text>

              <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                <View style={styles.settingLeft}>
                  <Volume2 size={18} color={colors.primary} />
                  <View style={styles.settingTextWrap}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>In-Game Audio Effects</Text>
                    <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Sound fx on clicks, wheel spins & loot drops</Text>
                  </View>
                </View>
                <Switch
                  value={soundEnabled}
                  onValueChange={handleToggleSound}
                  trackColor={{ false: '#334155', true: colors.primary }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                <View style={styles.settingLeft}>
                  <Vibrate size={18} color="#8b5cf6" />
                  <View style={styles.settingTextWrap}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>Haptic Feedback</Text>
                    <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Tactile phone vibrations on rewards</Text>
                  </View>
                </View>
                <Switch
                  value={hapticsEnabled}
                  onValueChange={handleToggleHaptics}
                  trackColor={{ false: '#334155', true: '#8b5cf6' }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View style={styles.settingLeft}>
                  <Bell size={18} color="#f59e0b" />
                  <View style={styles.settingTextWrap}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>Bonus Drop Notifications</Text>
                    <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Alerts when flash points drops become available</Text>
                  </View>
                </View>
                <Switch
                  value={pushEnabled}
                  onValueChange={handleTogglePush}
                  trackColor={{ false: '#334155', true: '#f59e0b' }}
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
    backgroundColor: '#0b111e',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: '#1e293b',
    maxHeight: '90%',
    minHeight: '60%',
    paddingBottom: Platform.OS === 'android' ? 20 : 34
  },
  sheetHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#64748b',
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
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  titleIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff'
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center'
  },
  settingsScroll: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    gap: 14
  },
  themeRow: {
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
    borderWidth: 1.5,
    backgroundColor: '#1e293b',
    borderColor: '#334155'
  },
  themeOptionBtnActive: {
    borderColor: '#06b6d4',
    backgroundColor: 'rgba(6, 182, 212, 0.12)'
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8'
  },
  themeOptionTextActive: {
    color: '#06b6d4'
  },
  profileCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#06b6d4',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '900',
    color: '#090d16'
  },
  profileInfo: {
    flex: 1
  },
  profileUsername: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff'
  },
  profileEmail: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1
  },
  vipTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4
  },
  vipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fbbf24'
  },
  referralBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  referralLabel: {
    fontSize: 10,
    color: '#94a3b8'
  },
  referralCode: {
    fontSize: 14,
    fontWeight: '900',
    color: '#06b6d4',
    letterSpacing: 0.5
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06b6d4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  shareBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff'
  },
  sectionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8
  },
  currencyBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  currencyBtnActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: '#06b6d4'
  },
  currencyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8'
  },
  currencyBtnTextActive: {
    color: '#06b6d4',
    fontWeight: '900'
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#162032'
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10
  },
  settingTextWrap: {
    flex: 1
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  },
  settingSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  actionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#162032'
  },
  actionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  actionItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  },
  actionItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155'
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1'
  },
  checkUpdateBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)'
  },
  checkUpdateBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#06b6d4'
  },
  complianceRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  complianceText: {
    flex: 1,
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f87171'
  }
});
