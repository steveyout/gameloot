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
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gamepad2, Sparkles, Lock, Mail, User, ShieldCheck } from 'lucide-react-native';
import { userLogin, userRegister } from '../api/clientApi';

export default function AuthScreen({ onAuthSuccess, onErrorAlert }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('demo_player');
  const [email, setEmail] = useState('player@gameloot.com');
  const [password, setPassword] = useState('player123');
  const [loading, setLoading] = useState(false);

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
      onErrorAlert(err.message || 'Cannot reach GameLoot server. Verify your internet/WiFi connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    if (loading) return;
    setUsername('demo_player');
    setPassword('player123');
    setLoading(true);
    try {
      const res = await userLogin('demo_player', 'player123');
      if (res && res.success && res.token) {
        onAuthSuccess(res.user, res.token);
      } else {
        // Try registering demo player if doesn't exist
        const regRes = await userRegister('demo_player', 'demo@gameloot.com', 'player123');
        if (regRes && regRes.success) {
          onAuthSuccess(regRes.user, regRes.token);
        } else {
          onErrorAlert(regRes?.message || 'Quick demo login failed.');
        }
      }
    } catch (err) {
      onErrorAlert('Demo login error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <LinearGradient
            colors={['#06b6d4', '#3b82f6']}
            style={styles.logoBadge}
          >
            <Gamepad2 size={36} color="#ffffff" />
          </LinearGradient>
          <Text style={styles.brandTitle}>GameLoot</Text>
          <Text style={styles.brandSubtitle}>Play HTML5 Games • Earn Rewards</Text>

          <View style={styles.bonusBanner}>
            <Sparkles size={14} color="#fbbf24" />
            <Text style={styles.bonusText}>
              Fair Play Value: 1,000 PTS = $1.00 USD
            </Text>
          </View>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          {/* Tab Switcher */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, isLogin && styles.tabBtnActive]}
              onPress={() => { if (!loading) setIsLogin(true); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, isLogin && styles.tabBtnTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, !isLogin && styles.tabBtnActive]}
              onPress={() => { if (!loading) setIsLogin(false); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, !isLogin && styles.tabBtnTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input Fields */}
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

            <TouchableOpacity
              style={[styles.demoBtn, loading && styles.demoBtnDisabled]}
              onPress={handleQuickDemo}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.demoBtnText}>⚡ 1-Tap Quick Demo Login (demo_player)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transparent Loyalty Rewards Note */}
        <View style={styles.complianceBox}>
          <ShieldCheck size={14} color="#10b981" />
          <Text style={styles.complianceText}>
            Advertiser-funded loyalty rewards. Low payout threshold ($1.00 min). No in-app purchases required to play or earn.
          </Text>
        </View>
      </ScrollView>
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
    marginTop: 8
  },
  submitBtnDisabled: {
    opacity: 0.7
  },
  btnGradient: {
    paddingVertical: 14,
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
  demoBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  demoBtnDisabled: {
    opacity: 0.6
  },
  demoBtnText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700'
  },
  complianceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
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
  }
});
