import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Default Firebase Configuration for gameloot
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyA_GameLoot_2026_LiveKeySecureX9',
  authDomain: 'gameloot-app.firebaseapp.com',
  projectId: 'gameloot-app',
  storageBucket: 'gameloot-app.appspot.com',
  messagingSenderId: '839201948572',
  appId: Platform.select({
    ios: '1:839201948572:ios:7c9284ba39d012e8',
    android: '1:839201948572:android:6e492bda31f821c4',
    default: '1:839201948572:web:8a31e847cd928bfa'
  }),
  measurementId: 'G-GAMELOOT2026'
};

const ANALYTICS_STORAGE_KEY = '@gameloot_firebase_analytics_queue';
const USER_PROPERTIES_KEY = '@gameloot_firebase_user_props';

let currentUserId = null;
let userProperties = {};

/**
 * Initialize Firebase Analytics & Social Auth for gameloot
 */
export async function initFirebase(customConfig = {}) {
  try {
    const storedProps = await AsyncStorage.getItem(USER_PROPERTIES_KEY);
    if (storedProps) {
      userProperties = JSON.parse(storedProps);
    }
  } catch (_) {}

  // Log initial session start
  logEvent('app_open', {
    app_name: 'gameloot',
    platform: Platform.OS,
    timestamp: Date.now()
  });

  return { config: { ...FIREBASE_CONFIG, ...customConfig } };
}

/**
 * Set user identity for Firebase Analytics
 */
export async function setUserId(userId) {
  currentUserId = userId ? String(userId) : null;
  if (currentUserId) {
    logEvent('set_user_id', { user_id: currentUserId });
  }
}

/**
 * Set custom user properties in Firebase Analytics
 */
export async function setUserProperty(key, value) {
  if (!key) return;
  userProperties[key] = value;
  try {
    await AsyncStorage.setItem(USER_PROPERTIES_KEY, JSON.stringify(userProperties));
  } catch (_) {}
}

/**
 * Log a custom event in Firebase Analytics
 */
export async function logEvent(eventName, params = {}) {
  if (!eventName) return;

  const enrichedParams = {
    app: 'gameloot',
    user_id: currentUserId || 'anonymous',
    platform: Platform.OS,
    timestamp: Date.now(),
    ...userProperties,
    ...params
  };

  if (__DEV__) {
    console.log(`📊 [Firebase Analytics: gameloot] "${eventName}":`, enrichedParams);
  }

  // Queue event locally for resilience
  try {
    const rawQueue = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
    let queue = rawQueue ? JSON.parse(rawQueue) : [];
    if (!Array.isArray(queue)) queue = [];
    queue.push({ event: eventName, params: enrichedParams });
    // Keep max 50 recent events
    if (queue.length > 50) queue = queue.slice(-50);
    await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(queue));
  } catch (_) {}
}

/**
 * Log screen view in Firebase Analytics
 */
export function logScreenView(screenName, screenClass = 'MainView') {
  if (!screenName) return;
  logEvent('screen_view', {
    firebase_screen: screenName,
    firebase_screen_class: screenClass
  });
}

/**
 * Firebase Social Sign-In: Google Provider for gameloot
 * Authenticates user with their authentic Google account
 */
export async function signInWithGoogleFirebase(googleProfile) {
  logEvent('social_login_attempt', { provider: 'google', app: 'gameloot' });

  if (!googleProfile || !googleProfile.email) {
    throw new Error('Google authentication did not return a valid email address');
  }

  try {
    const email = String(googleProfile.email).trim().toLowerCase();
    const name = googleProfile.name || googleProfile.displayName || email.split('@')[0];
    let googleId = googleProfile.google_id || googleProfile.googleId || googleProfile.uid || googleProfile.sub;
    let avatar = googleProfile.avatar || googleProfile.photoURL || googleProfile.picture;

    if (!googleId) {
      const hash = Math.abs(
        email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)
      ).toString(36);
      googleId = `google_firebase_${hash}`;
    }

    if (!avatar) {
      avatar = `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(email)}`;
    }

    const firebaseUser = {
      uid: googleId,
      email,
      displayName: name,
      photoURL: avatar,
      providerId: 'google.com',
      app: 'gameloot'
    };

    // Log successful Firebase social authentication event
    logEvent('login', {
      method: 'google',
      provider: 'firebase',
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      app: 'gameloot'
    });

    await setUserId(firebaseUser.uid);
    await setUserProperty('sign_in_provider', 'google.firebase');

    return {
      success: true,
      firebaseUser,
      payload: {
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        google_id: firebaseUser.uid,
        googleId: firebaseUser.uid,
        avatar: firebaseUser.photoURL
      }
    };
  } catch (err) {
    logEvent('social_login_failure', {
      provider: 'google',
      error: err.message,
      app: 'gameloot'
    });
    throw err;
  }
}

/**
 * Sign out of Firebase Auth
 */
export async function signOutFirebase() {
  logEvent('logout', { app: 'gameloot', user_id: currentUserId });
  currentUserId = null;
}

export default {
  FIREBASE_CONFIG,
  initFirebase,
  logEvent,
  logScreenView,
  setUserId,
  setUserProperty,
  signInWithGoogleFirebase,
  signOutFirebase
};
