import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveHost() {
  // If running via Expo Go on physical device or emulator, get host IP dynamically from Expo packager/debugger host
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || '';
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5000`;
    }
  }

  // Fallback to LAN IP (192.168.100.214) or Android emulator loopback (10.0.2.2)
  if (Platform.OS === 'android') {
    return 'http://192.168.100.214:5000';
  }
  return 'http://localhost:5000';
}

export const DEFAULT_HOST = resolveHost();
export const API_BASE_URL = `${DEFAULT_HOST}/api`;
export const SOCKET_URL = DEFAULT_HOST;

// App version embedded inside build (dynamically retrieved from app.json)
export const CURRENT_APP_VERSION = Constants.expoConfig?.version || '1.0.0';
export const CURRENT_VERSION_CODE = Constants.expoConfig?.android?.versionCode || 1;
export const PLATFORM = Platform.OS;
