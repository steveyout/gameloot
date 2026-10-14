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
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Gamepad2, Sparkles, Lock, Mail, User, X, Shield, FileText } from 'lucide-react-native';
import { userLogin, userRegister } from '../api/clientApi';
import { API_BASE_URL } from '../api/config';
import { logEvent } from '../services/firebase';
import LegalModal from '../components/LegalModal';

export default function AuthScreen({ onAuthSuccess, onErrorAlert, payoutsEnabled = false }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Real Google Sign-In Web OAuth Modal
  const [googleAuthVisible, setGoogleAuthVisible] = useState(false);

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
        logEvent(isLogin ? 'login_success' : 'sign_up_success', {
          method: 'credentials',
          user_id: res.user?.id,
          app: 'gameloot'
        });
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

  /**
   * Handle real Google OAuth callback from the hosted Google Sign-In WebView
   */
  const handleGoogleWebMessage = (event) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.type === 'GOOGLE_AUTH_SUCCESS') {
        setGoogleAuthVisible(false);
        logEvent('login_success', {
          provider: 'google.oauth',
          user_id: payload.user?.id,
          email: payload.user?.email,
          app: 'gameloot'
        });
        onAuthSuccess(payload.user, payload.token);
      } else if (payload.type === 'GOOGLE_AUTH_CANCEL') {
        setGoogleAuthVisible(false);
      } else if (payload.type === 'GOOGLE_AUTH_ERROR') {
        setGoogleAuthVisible(false);
        onErrorAlert(payload.message || 'Google authentication was cancelled or failed.');
      }
    } catch (err) {
      console.warn('Failed to parse Google OAuth message:', err.message);
    }
  };

  const googleAuthUrl = `${API_BASE_URL}/auth/google/signin`;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <LinearGradient
            colors={['#517bfd', '#3659c2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBadge}
          >
            <Gamepad2 size={36} color="#ffffff" />
          </LinearGradient>
          <Text style={styles.brandTitle}>gameloot</Text>
          <Text style={styles.brandSubtitle}>
            {payoutsEnabled
              ? 'Instant Games Arcade • Play & Earn Real Rewards'
              : 'Instant Games Arcade • Play & Compete'}
          </Text>

          <View style={styles.bonusBanner}>
            <Sparkles size={13} color="#517bfd" />
            <Text style={styles.bonusText}>
              {payoutsEnabled
                ? 'NEW PLAYERS GET +100 PTS ON SIGN UP'
                : 'FREE TO PLAY • UNLIMITED INSTANT GAMES'}
            </Text>
          </View>
        </View>

        {/* Auth Form Card */}
        <View style={styles.card}>
          {/* Toggle Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, isLogin && styles.tabBtnActive]}
              onPress={() => setIsLogin(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, isLogin && styles.tabBtnTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, !isLogin && styles.tabBtnActive]}
              onPress={() => setIsLogin(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, !isLogin && styles.tabBtnTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputWrap}>
                <User size={16} color="#979caf" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter username"
                  placeholderTextColor="#686d82"
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
                  <Mail size={16} color="#979caf" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email address"
                    placeholderTextColor="#686d82"
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
                <Lock size={16} color="#979caf" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor="#686d82"
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
                colors={['#517bfd', '#3659c2']}
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

            {/* Google Sign In Button - Triggers Google OAuth Directly */}
            <TouchableOpacity
              style={[styles.googleBtn, loading && styles.googleBtnDisabled]}
              onPress={() => setGoogleAuthVisible(true)}
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
                By continuing, you agree to gameloot's{' '}
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

        {/* Public Legal Access Row */}
        <View style={styles.publicLegalRow}>
          <TouchableOpacity
            style={styles.publicLegalBtn}
            onPress={() => handleOpenLegal('privacy')}
            activeOpacity={0.7}
          >
            <Shield size={13} color="#517bfd" />
            <Text style={styles.publicLegalBtnText}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.publicLegalDot}>•</Text>
          <TouchableOpacity
            style={styles.publicLegalBtn}
            onPress={() => handleOpenLegal('terms')}
            activeOpacity={0.7}
          >
            <FileText size={13} color="#517bfd" />
            <Text style={styles.publicLegalBtnText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Real Google Account OAuth Sign-In Modal */}
      <Modal
        visible={googleAuthVisible}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setGoogleAuthVisible(false)}
      >
        <SafeAreaView style={styles.googleModalContainer} edges={['top', 'left', 'right', 'bottom']}>
          {/* Header Bar */}
          <View style={styles.googleModalHeader}>
            <View style={styles.googleModalHeaderLeft}>
              <View style={styles.googleLogoWrapSmall}>
                <Text style={styles.googleLogoGSmall}>G</Text>
              </View>
              <View>
                <Text style={styles.googleModalTitle}>Google Sign-In</Text>
                <Text style={styles.googleModalSub}>Sign in with your Google account</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.googleModalCloseBtn}
              onPress={() => setGoogleAuthVisible(false)}
              activeOpacity={0.75}
            >
              <X size={20} color="#979caf" />
            </TouchableOpacity>
          </View>

          {/* Hosted Google OAuth Web View */}
          <View style={styles.googleWebContainer}>
            <WebView
              source={{ uri: googleAuthUrl }}
              style={styles.googleWebView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              userAgent="Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36"
              onMessage={handleGoogleWebMessage}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.googleWebLoading}>
                  <ActivityIndicator size="large" color="#517bfd" />
                  <Text style={styles.googleWebLoadingText}>Connecting to Google Accounts...</Text>
                </View>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Public In-App Legal Documents Reader Modal */}
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
    backgroundColor: '#0b0c12'
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
    shadowColor: '#517bfd',
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
    color: '#979caf',
    marginTop: 2
  },
  bonusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(81, 123, 253, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(81, 123, 253, 0.3)'
  },
  bonusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#517bfd'
  },
  card: {
    backgroundColor: '#151722',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#23263b'
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1d2030',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10
  },
  tabBtnActive: {
    backgroundColor: '#517bfd'
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#979caf'
  },
  tabBtnTextActive: {
    color: '#ffffff'
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
    color: '#979caf'
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1d2030',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#343852',
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
    backgroundColor: '#23263b'
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#686d82',
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
    shadowColor: '#517bfd',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3
  },
  googleBtnDisabled: {
    opacity: 0.75
  },
  googleLogoWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#517bfd',
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
    color: '#060507',
    fontSize: 13,
    fontWeight: '700'
  },
  legalNoticeWrap: {
    marginTop: 4,
    paddingHorizontal: 4
  },
  legalNoticeText: {
    fontSize: 11,
    color: '#979caf',
    textAlign: 'center',
    lineHeight: 16
  },
  legalNoticeLink: {
    color: '#517bfd',
    fontWeight: '700',
    textDecorationLine: 'underline'
  },
  publicLegalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
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
    color: '#517bfd',
    fontSize: 12,
    fontWeight: '700'
  },
  publicLegalDot: {
    color: '#686d82',
    fontSize: 12
  },
  googleModalContainer: {
    flex: 1,
    backgroundColor: '#090d16'
  },
  googleModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#151722',
    borderBottomWidth: 1,
    borderBottomColor: '#23263b'
  },
  googleModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  googleLogoWrapSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#517bfd',
    alignItems: 'center',
    justifyContent: 'center'
  },
  googleLogoGSmall: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900'
  },
  googleModalTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  googleModalSub: {
    color: '#979caf',
    fontSize: 11
  },
  googleModalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1d2030'
  },
  googleWebContainer: {
    flex: 1,
    backgroundColor: '#090d16'
  },
  googleWebView: {
    flex: 1,
    backgroundColor: '#090d16'
  },
  googleWebLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#090d16',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 10
  },
  googleWebLoadingText: {
    color: '#979caf',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12
  }
});
