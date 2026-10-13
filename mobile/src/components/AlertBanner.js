import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  Modal
} from 'react-native';
import { CheckCircle2, AlertCircle, Sparkles, X, Info } from 'lucide-react-native';

export default function AlertBanner({ alert, onDismiss }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!alert) return;

    // Reset and animate in
    translateY.setValue(-100);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      })
    ]).start();

    // Auto dismiss after 3.8s
    const timer = setTimeout(() => {
      handleDismiss();
    }, 3800);

    return () => clearTimeout(timer);
  }, [alert]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 220,
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  if (!alert) return null;

  const { type = 'info', message, title, pts } = alert;

  const getTheme = () => {
    switch (type) {
      case 'success':
      case 'points':
        return {
          bg: '#052e16',
          border: '#16a34a',
          titleColor: '#4ade80',
          textColor: '#bbf7d0',
          Icon: type === 'points' ? Sparkles : CheckCircle2,
          iconColor: '#22c55e',
          shadow: '#22c55e'
        };
      case 'error':
        return {
          bg: '#450a0a',
          border: '#dc2626',
          titleColor: '#f87171',
          textColor: '#fecaca',
          Icon: AlertCircle,
          iconColor: '#ef4444',
          shadow: '#ef4444'
        };
      case 'warning':
        return {
          bg: '#451a03',
          border: '#d97706',
          titleColor: '#fbbf24',
          textColor: '#fef3c7',
          Icon: AlertCircle,
          iconColor: '#f59e0b',
          shadow: '#f59e0b'
        };
      default:
        return {
          bg: '#082f49',
          border: '#0284c7',
          titleColor: '#38bdf8',
          textColor: '#bae6fd',
          Icon: Info,
          iconColor: '#0ea5e9',
          shadow: '#0ea5e9'
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.Icon;

  return (
    <Modal
      visible={!!alert}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalRoot} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.overlayContainer,
            {
              transform: [{ translateY }],
              opacity
            }
          ]}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.bg,
                borderColor: theme.border,
                shadowColor: theme.shadow
              }
            ]}
          >
            <View style={styles.iconWrap}>
              <IconComponent size={20} color={theme.iconColor} />
            </View>

            <View style={styles.textWrap}>
              {title ? <Text style={[styles.title, { color: theme.titleColor }]}>{title}</Text> : null}
              <Text style={[styles.message, { color: theme.textColor }]}>{message}</Text>
              {pts ? (
                <View style={styles.ptsBadge}>
                  <Text style={styles.ptsBadgeText}>+{pts} PTS ($0.001 USD/PT)</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={16} color={theme.textColor} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const topOffset = Platform.OS === 'android'
  ? (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 42)
  : 52;

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  overlayContainer: {
    position: 'absolute',
    top: topOffset,
    left: 16,
    right: 16,
    zIndex: 999999,
    elevation: 9999
  },
  card: {
    padding: 13,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10
  },
  iconWrap: {
    marginRight: 10,
    marginTop: 2
  },
  textWrap: {
    flex: 1
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2
  },
  message: {
    fontSize: 12,
    lineHeight: 16
  },
  ptsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 6
  },
  ptsBadgeText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '800'
  },
  closeBtn: {
    padding: 4,
    marginLeft: 6
  }
});
