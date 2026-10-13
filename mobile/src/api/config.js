import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Official Production Host Domain
export const PRODUCTION_HOST = 'https://gameloot.youplex.cc';

// Default host strictly set to production domain for all builds
export const DEFAULT_HOST = PRODUCTION_HOST;
export const API_BASE_URL = `${DEFAULT_HOST}/api`;
export const SOCKET_URL = DEFAULT_HOST;

// App version embedded inside build (dynamically retrieved from app.json)
export const CURRENT_APP_VERSION = Constants?.expoConfig?.version || '1.0.0';
export const CURRENT_VERSION_CODE = Constants?.expoConfig?.android?.versionCode || 1;
export const PLATFORM = Platform.OS;
