import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  SafeAreaView
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Gamepad2, Sparkles, Lock, Mail, User, Shield, FileText, X } from 'lucide-react-native';
import { userLogin, userRegister, userGoogleLogin } from '../api/clientApi';
import { logEvent } from '../services/firebase';
import LegalModal from '../components/LegalModal';

const GOOGLE_CLIENT_ID = '854151275080-m8kjng2jotbflnuir8ooq5ibhmgguaj0.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URI = 'https://gameloot-e2358.firebaseapp.com/__/auth/handler';

const GOOGLE_USER_AGENT =
  Platform.OS === 'ios'
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
    : 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36';

function base64Decode(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  str = String(str).replace(/=+$/, '');
  for (
    let bc = 0, bs = 0, buffer, idx = 0;
    (buffer = str.charAt(idx++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(buffer);
  }
  return output;
}

function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const decodedStr = base64Decode(base64);
    return JSON.parse(decodedStr);
  } catch (err) {
    console.warn('JWT payload decode error:', err.message);
    return null;
  }
}

export default function AuthScreen({ onAuthSuccess, onErrorAlert, payoutsEnabled = false }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // In-App Google Sign-In Popup State (No External Browsers)
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [verifyingGoogle, setVerifyingGoogle] = useState(false);
  const [googleAuthNonce, setGoogleAuthNonce] = useState(
    () => Math.random().toString(36).substring(2) + Date.now().toString(36)
  );
  const isProcessingGoogleAuth = useRef(false);

  // Public Legal modal state
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState('privacy');

  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
    `&response_type=token%20id_token` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&prompt=select_account` +
    `&nonce=${encodeURIComponent(googleAuthNonce)}`;

  const handleOpenLegal = (tab = 'privacy') => {
    setLegalModalTab(tab);
    setLegalModalVisible(true);
  };

  const handleSubmit = async () => {
    if (loading || verifyingGoogle) return;
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
   * Triggers the Google Sign-In In-App Popup Dialog
   * Avoids launching Chrome, Safari, or external browsers entirely
   */
  const handleGoogleSignIn = () => {
    if (loading || verifyingGoogle) return;
    const newNonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
    setGoogleAuthNonce(newNonce);
    isProcessingGoogleAuth.current = false;
    setVerifyingGoogle(false);
    setGoogleModalVisible(true);
  };

  const handleInterceptGoogleUrl = async (url) => {
    if (!url) return;
    if (
      url.includes('firebaseapp.com/__/auth/handler') ||
      url.includes('id_token=') ||
      url.includes('access_token=')
    ) {
      if (isProcessingGoogleAuth.current) return;
      isProcessingGoogleAuth.current = true;
      setVerifyingGoogle(true);

      try {
        const hashIdx = url.indexOf('#');
        const queryIdx = url.indexOf('?');
        let paramStr = '';
        if (hashIdx !== -1) paramStr += '&' + url.substring(hashIdx + 1);
        if (queryIdx !== -1) {
          const end = hashIdx !== -1 && hashIdx > queryIdx ? hashIdx : url.length;
          paramStr += '&' + url.substring(queryIdx + 1, end);
        }

        const params = {};
        paramStr.split('&').forEach((part) => {
          if (!part) return;
          const [k, v] = part.split('=');
          if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
        });

        if (params.error) {
          setVerifyingGoogle(false);
          setGoogleModalVisible(false);
          if (params.error !== 'access_denied') {
            onErrorAlert(params.error_description || params.error || 'Google sign-in was cancelled or failed.');
          }
          return;
        }

        let googleUser = null;

        if (params.id_token) {
          googleUser = decodeJwtPayload(params.id_token);
        }

        if ((!googleUser || !googleUser.email) && params.access_token) {
          try {
            const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${params.access_token}` }
            });
            const info = await userinfoRes.json();
            if (info && info.email) {
              googleUser = {
                email: info.email,
                name: info.name || info.given_name,
                sub: info.sub || info.id,
                picture: info.picture
              };
            }
          } catch (fetchErr) {
            console.warn('Failed to fetch userinfo from Google:', fetchErr.message);
          }
        }

        if (googleUser && googleUser.email) {
          const res = await userGoogleLogin({
            email: googleUser.email,
            name: googleUser.name,
            google_id: googleUser.sub || googleUser.id,
            avatar: googleUser.picture
          });

          if (res && res.success && res.token) {
            logEvent('login_success', {
              provider: 'google.popup',
              user_id: res.user?.id,
              email: res.user?.email,
              app: 'gameloot'
            });
            setGoogleModalVisible(false);
            setVerifyingGoogle(false);
            onAuthSuccess(res.user, res.token);
            return;
          } else {
            onErrorAlert(res?.message || 'Failed to authenticate Google user with GameLoot server.');
          }
        } else {
          onErrorAlert('Could not retrieve verified email from Google.');
        }
      } catch (err) {
        console.warn('Google popup auth error:', err.message);
        onErrorAlert(err.message || 'Authentication error occurred.');
      } finally {
        setVerifyingGoogle(false);
        setGoogleModalVisible(false);
        isProcessingGoogleAuth.current = false;
      }
    }
  };

  const handleShouldStartLoadWithRequest = (request) => {
    if (
      request.url.includes('firebaseapp.com/__/auth/handler') ||
      request.url.includes('id_token=') ||
      request.url.includes('access_token=')
    ) {
      handleInterceptGoogleUrl(request.url);
      return false;
    }
    return true;
  };

  const handleNavigationStateChange = (navState) => {
    if (
      navState.url.includes('firebaseapp.com/__/auth/handler') ||
      navState.url.includes('id_token=') ||
      navState.url.includes('access_token=')
    ) {
      handleInterceptGoogleUrl(navState.url);
    }
  };

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
              ? 'Instant Games Arcade \u2022 Play & Earn Real Rewards'
              : 'Instant Games Arcade \u2022 Play & Compete'}
          </Text>

          <View style={styles.bonusBanner}>
            <Sparkles size={13} color="#517bfd" />
            <Text style={styles.bonusText}>
              {payoutsEnabled
                ? 'NEW PLAYERS GET +100 PTS ON SIGN UP'
                : 'FREE TO PLAY \u2022 UNLIMITED INSTANT GAMES'}
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
                  editable={!loading && !verifyingGoogle}
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
                    editable={!loading && !verifyingGoogle}
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
                  editable={!loading && !verifyingGoogle}
                />
              </View>
            </View>

            {/* Standard Email Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, (loading || verifyingGoogle) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading || verifyingGoogle}
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

            {/* Google Sign In Button - Triggers In-App Google Popup Modal */}
            <TouchableOpacity
              style={[styles.googleBtn, (loading || verifyingGoogle) && styles.googleBtnDisabled]}
              onPress={handleGoogleSignIn}
              disabled={loading || verifyingGoogle}
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
          <Text style={styles.publicLegalDot}>\u2022</Text>
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

      {/* In-App Google Sign-In Popup Dialog (No External Browser, No Chrome/Safari) */}
      <Modal
        visible={googleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setGoogleModalVisible(false);
          setVerifyingGoogle(false);
        }}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.googleBadge}>
                  <Text style={styles.googleBadgeLetter}>G</Text>
                </View>
                <View>
                  <Text style={styles.modalTitleText}>Sign in with Google</Text>
                  <Text style={styles.modalSubtitleText}>Select your Google Account</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  setGoogleModalVisible(false);
                  setVerifyingGoogle(false);
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={18} color="#979caf" />
              </TouchableOpacity>
            </View>

            {/* Modal Body with WebView */}
            <View style={styles.modalBody}>
              <WebView
                key={googleAuthNonce}
                source={{ uri: googleAuthUrl }}
                userAgent={GOOGLE_USER_AGENT}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                thirdPartyCookiesEnabled={true}
                sharedCookiesEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.webViewLoader}>
                    <ActivityIndicator size="large" color="#517bfd" />
                    <Text style={styles.webViewLoaderText}>Connecting to Google Account Services...</Text>
                  </View>
                )}
                onNavigationStateChange={handleNavigationStateChange}
                onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                style={styles.webView}
              />

              {verifyingGoogle && (
                <View style={styles.verifyingOverlay}>
                  <ActivityIndicator size="large" color="#517bfd" />
                  <Text style={styles.verifyingText}>Logging in to GameLoot...</Text>
                </View>
              )}
            </View>
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

  // In-App Popup Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    height: '84%',
    backgroundColor: '#151722',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#23263b',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#23263b',
    backgroundColor: '#191b29'
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  googleBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  googleBadgeLetter: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4285F4'
  },
  modalTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff'
  },
  modalSubtitleText: {
    fontSize: 11,
    color: '#979caf'
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBody: {
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'relative'
  },
  webView: {
    flex: 1
  },
  webViewLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#151722',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  webViewLoaderText: {
    color: '#979caf',
    fontSize: 13,
    fontWeight: '600'
  },
  verifyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(21, 23, 34, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    zIndex: 99
  },
  verifyingText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  }
});
