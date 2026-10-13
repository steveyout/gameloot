import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gamepad2, Sparkles, Lock, Mail, User, ShieldCheck, X, Check, Shield, FileText } from 'lucide-react-native';
import { userLogin, userRegister, userGoogleLogin } from '../api/clientApi';
import LegalModal from '../components/LegalModal';

export default function AuthScreen({ onAuthSuccess, onErrorAlert }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Login modal state
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Public Legal modal state - No Login Required
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState('privacy');

  const handleOpenLegal = (tab = 'privacy') => {
    setLegalModalTab(tab);
    setLegalModalVisible(true);
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!username.trim() || !password.trim()) {
      onErrorAlert('Please enter your username and password');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (isLogin) {
        res = await userLogin(username.trim(), password);
      } else {
        if (!email.trim()) {
          onErrorAlert('Email is required for registration');
          setLoading(false);
          return;
        }
        res = await userRegister(username.trim(), email.trim(), password);
      }

      if (res && res.success && res.token) {
        onAuthSuccess(res.user, res.token);
      } else {
        onErrorAlert(res?.message || 'Authentication failed. Please check credentials.');
      }
    } catch (err) {
      onErrorAlert(err.message || 'Network error during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInPrompt = () => {
    // Open one-tap simulated OAuth modal
    setGoogleEmail(username.includes('@') ? username : 'player@gmail.com');
    setGoogleName(username || 'Loyal Player');
    setGoogleModalVisible(true);
  };

  const executeGoogleAuth = async (targetEmail, targetName) => {
    if (!targetEmail.trim()) {
      onErrorAlert('Please provide a Google account email');
      return;
    }

    setGoogleLoading(true);
    try {
      const res = await userGoogleLogin({
        email: targetEmail.trim(),
        name: targetName.trim() || 'GameLoot Player',
        googleId: 'g_' + Math.abs(targetEmail.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString(36),
        avatar: `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(targetEmail)}`
      });

      if (res && res.success && res.token) {
        setGoogleModalVisible(false);
        onAuthSuccess(res.user, res.token);
      } else {
        onErrorAlert(res?.message || 'Google authentication failed.');
      }
    } catch (err) {
      onErrorAlert(err.message || 'Google OAuth failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <LinearGradient
            colors={['#06b6d4', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBadge}
          >
            <Gamepad2 size={36} color="#ffffff" />
          </LinearGradient>
          <Text style={styles.brandTitle}>GAMELOOT</Text>
          <Text style={styles.brandSubtitle}>Play HTML5 Games • Earn Real Cash</Text>
          <View style={styles.bonusBanner}>
            <Sparkles size={14} color="#fbbf24" />
            <Text style={styles.bonusText}>NEW PLAYERS: 100 PTS SIGNUP BONUS</Text>
          </View>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          {/* Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, isLogin && styles.tabBtnActive]}
              onPress={() => setIsLogin(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, isLogin && styles.tabBtnTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, !isLogin && styles.tabBtnActive]}
              onPress={() => setIsLogin(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, !isLogin && styles.tabBtnTextActive]}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputWrap}>
                <User size={16} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter username"
                  placeholderTextColor="#475569"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrap}>
                  <Mail size={16} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email address"
                    placeholderTextColor="#475569"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Lock size={16} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
            </View>

            {/* Standard Email Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#06b6d4', '#2563eb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.btnText}>Authenticating...</Text>
                  </View>
                ) : (
                  <Text style={styles.btnText}>{isLogin ? 'Sign In & Play' : 'Create Free Account'}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In Button */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleSignInPrompt}
              disabled={loading}
              activeOpacity={0.85}
            >
              <View style={styles.googleLogoWrap}>
                <Text style={styles.googleLogoG}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Terms of Service & Privacy Policy Acceptance notice */}
            <View style={styles.legalNoticeWrap}>
              <Text style={styles.legalNoticeText}>
                By continuing, you agree to GameLoot's{' '}
                <Text
                  style={styles.legalNoticeLink}
                  onPress={() => handleOpenLegal('terms')}
                >
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text
                  style={styles.legalNoticeLink}
                  onPress={() => handleOpenLegal('privacy')}
                >
                  Privacy Policy
                </Text>.
              </Text>
            </View>
          </View>
        </View>

        {/* Transparent Loyalty Rewards Note */}
        <View style={styles.complianceBox}>
          <ShieldCheck size={14} color="#10b981" />
          <Text style={styles.complianceText}>
            Advertiser-funded loyalty rewards. Low payout threshold ($1.00 min). No in-app purchases required to play or earn.
          </Text>
        </View>

        {/* Public Legal Access Row - 100% accessible without login */}
        <View style={styles.publicLegalRow}>
          <TouchableOpacity
            style={styles.publicLegalBtn}
            onPress={() => handleOpenLegal('privacy')}
            activeOpacity={0.7}
          >
            <Shield size={13} color="#06b6d4" />
            <Text style={styles.publicLegalBtnText}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.publicLegalDot}>•</Text>
          <TouchableOpacity
            style={styles.publicLegalBtn}
            onPress={() => handleOpenLegal('terms')}
            activeOpacity={0.7}
          >
            <FileText size={13} color="#06b6d4" />
            <Text style={styles.publicLegalBtnText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Google OAuth One-Tap Modal */}
      <Modal
        visible={googleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGoogleModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.googleLogoWrapLarge}>
                <Text style={styles.googleLogoGLarge}>G</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalTitle}>Sign in with Google</Text>
                <Text style={styles.modalSubtitle}>to continue to GameLoot Rewards</Text>
              </View>
              <TouchableOpacity onPress={() => setGoogleModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Enter Google Account Details */}
            <View style={{ gap: 10, marginTop: 8 }}>
              <TextInput
                style={styles.modalInput}
                placeholder="Google email address"
                placeholderTextColor="#64748b"
                value={googleEmail}
                onChangeText={setGoogleEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Full Name (optional)"
                placeholderTextColor="#64748b"
                value={googleName}
                onChangeText={setGoogleName}
              />
            </View>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, googleLoading && { opacity: 0.6 }]}
              onPress={() => executeGoogleAuth(googleEmail, googleName)}
              disabled={googleLoading}
            >
              <LinearGradient
                colors={['#4285F4', '#2b6cb0']}
                style={styles.modalSubmitGradient}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Authorize & Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Public In-App Legal Documents Reader Modal - Zero Login Barrier */}
      <LegalModal
        visible={legalModalVisible}
        initialTab={legalModalTab}
        onClose={() => setLegalModalVisible(false)}
        isDark={true}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16'
  },
  scroll: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%'
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2
  },
  bonusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)'
  },
  bonusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fbbf24'
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8
  },
  tabBtnActive: {
    backgroundColor: '#06b6d4'
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8'
  },
  tabBtnTextActive: {
    color: '#090d16'
  },
  form: {
    gap: 14
  },
  inputGroup: {
    gap: 6
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1'
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12
  },
  inputIcon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    height: 44,
    color: '#ffffff',
    fontSize: 13
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 6
  },
  submitBtnDisabled: {
    opacity: 0.7
  },
  btnGradient: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155'
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    paddingHorizontal: 8,
    letterSpacing: 0.5
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3
  },
  googleLogoWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  googleLogoG: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16
  },
  googleBtnText: {
    color: '#1f2937',
    fontSize: 13,
    fontWeight: '700'
  },
  legalNoticeWrap: {
    marginTop: 4,
    paddingHorizontal: 4
  },
  legalNoticeText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16
  },
  legalNoticeLink: {
    color: '#06b6d4',
    fontWeight: '700',
    textDecorationLine: 'underline'
  },
  complianceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)'
  },
  complianceText: {
    fontSize: 10,
    color: '#6ee7b7',
    lineHeight: 14,
    flex: 1
  },
  publicLegalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    paddingVertical: 8
  },
  publicLegalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  publicLegalBtnText: {
    color: '#06b6d4',
    fontSize: 12,
    fontWeight: '700'
  },
  publicLegalDot: {
    color: '#475569',
    fontSize: 12
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 22,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  googleLogoWrapLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  googleLogoGLarge: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff'
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#94a3b8'
  },
  modalCloseBtn: {
    padding: 6
  },
  modalInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 12
  },
  modalSubmitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 16
  },
  modalSubmitGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  }
});
