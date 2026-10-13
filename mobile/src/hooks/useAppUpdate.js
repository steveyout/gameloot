import { useState, useEffect, useCallback } from 'react';
import { AppState, Linking } from 'react-native';
import io from 'socket.io-client';
import { checkAppVersion } from '../api/clientApi';
import { CURRENT_APP_VERSION, CURRENT_VERSION_CODE, SOCKET_URL } from '../api/config';

export function useAppUpdate() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showForcedModal, setShowForcedModal] = useState(false);
  const [showOptionalBanner, setShowOptionalBanner] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const performCheck = useCallback(async (isManual = false) => {
    try {
      setIsChecking(true);
      setErrorMsg(null);
      const data = await checkAppVersion(CURRENT_APP_VERSION, CURRENT_VERSION_CODE);

      if (data && data.success) {
        setUpdateInfo(data);

        if (data.update_required) {
          // Mandatory / Forced Update
          setShowForcedModal(true);
          setShowOptionalBanner(false);
        } else if (data.has_update) {
          // Optional Update available
          setShowOptionalBanner(true);
          setShowForcedModal(false);
        } else {
          // Fully Up to Date
          setShowForcedModal(false);
          setShowOptionalBanner(false);
        }
      }
      return data;
    } catch (err) {
      console.warn('Update check failed:', err.message);
      setErrorMsg(err.message);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // 1. Initial check on app startup
  useEffect(() => {
    performCheck(false);
  }, [performCheck]);

  // 2. Re-check whenever app comes to foreground from background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        performCheck(false);
      }
    });
    return () => subscription.remove();
  }, [performCheck]);

  // 3. Real-time WebSocket listener for immediate instant force updates triggered by Admin
  useEffect(() => {
    let socket = null;
    try {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000
      });

      socket.on('app_force_update', (broadcastData) => {
        console.log('⚡ [Socket] Received immediate app force update push:', broadcastData);
        // Immediately re-verify against API
        performCheck(false);
      });
    } catch (e) {
      console.warn('Socket update listener error:', e);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [performCheck]);

  const openUpdateUrl = useCallback(() => {
    const url = updateInfo?.update_url || 'https://github.com/steveyout/gameloot/releases/latest';
    Linking.openURL(url).catch(err => console.error('Failed to open update URL:', err));
  }, [updateInfo]);

  const openApkDownloadUrl = useCallback(() => {
    const url = updateInfo?.download_apk_url || 'https://github.com/steveyout/gameloot/releases/latest/download/GameLoot.apk';
    Linking.openURL(url).catch(err => console.error('Failed to open APK URL:', err));
  }, [updateInfo]);

  const dismissOptionalBanner = () => {
    setShowOptionalBanner(false);
  };

  const dismissForcedModal = () => {
    setShowForcedModal(false);
  };

  return {
    updateInfo,
    isChecking,
    showForcedModal,
    showOptionalBanner,
    errorMsg,
    checkForUpdate: () => performCheck(true),
    openUpdateUrl,
    openApkDownloadUrl,
    dismissOptionalBanner,
    dismissForcedModal,
    currentVersion: CURRENT_APP_VERSION,
    currentVersionCode: CURRENT_VERSION_CODE
  };
}
