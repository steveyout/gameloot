import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const PRODUCTION_HOST = 'https://gameloot.youplex.cc';

function resolveHost() {
  // If explicitly developing via local Expo Go packager on device or emulator
  try {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest?.debuggerHost || '';
      if (hostUri) {
        const ip = hostUri.split(':')[0];
        if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
          return `http://${ip}:5000`;
        }
      }
      // Android emulator loopback in dev
      if (Platform.OS === 'android' && Constants?.isDevice === false) {
        return 'http://10.0.2.2:5000';
      }
    }
  } catch (e) {
    // Ignore and fallback to production host
  }

  // Official production host
  return PRODUCTION_HOST;
}

export const DEFAULT_HOST = resolveHost();
export const API_BASE_URL = `${DEFAULT_HOST}/api`;
export const SOCKET_URL = DEFAULT_HOST;

// App version embedded inside build (dynamically retrieved from app.json)
export const CURRENT_APP_VERSION = Constants?.expoConfig?.version || '1.0.0';
export const CURRENT_VERSION_CODE = Constants?.expoConfig?.android?.versionCode || 1;
export const PLATFORM = Platform.OS;
