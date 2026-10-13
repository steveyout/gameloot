import * as Haptics from 'expo-haptics';
import { Vibration, Platform } from 'react-native';

let soundEnabled = true;

export function setSoundEnabled(enabled) {
  soundEnabled = !!enabled;
}

export function isSoundEnabled() {
  return soundEnabled;
}

/**
 * Play sound effect safely without deprecated ExpoAV native module
 * Provides crisp tactile haptic feedback on mobile devices
 * @param {'tick' | 'coin' | 'chestOpen' | 'win' | 'spin'} name
 */
export async function playSound(name) {
  if (!soundEnabled) return;

  try {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      if (name === 'tick' || name === 'spin') {
        await triggerHaptic('light');
      } else if (name === 'coin') {
        await triggerHaptic('medium');
      } else if (name === 'chestOpen' || name === 'win') {
        await triggerHaptic('success');
      }
    }
  } catch (_) {
    // Fail-safe - never throw or crash
  }
}

/**
 * Trigger tactile haptic vibration feedback safely
 * @param {'light' | 'medium' | 'heavy' | 'success'} type
 */
export async function triggerHaptic(type = 'light') {
  try {
    if (Haptics && (Platform.OS === 'android' || Platform.OS === 'ios')) {
      switch (type) {
        case 'light':
          if (Haptics.impactAsync && Haptics.ImpactFeedbackStyle?.Light) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else {
            Vibration.vibrate(20);
          }
          break;
        case 'medium':
          if (Haptics.impactAsync && Haptics.ImpactFeedbackStyle?.Medium) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } else {
            Vibration.vibrate(30);
          }
          break;
        case 'heavy':
          if (Haptics.impactAsync && Haptics.ImpactFeedbackStyle?.Heavy) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          } else {
            Vibration.vibrate(40);
          }
          break;
        case 'success':
          if (Haptics.notificationAsync && Haptics.NotificationFeedbackType?.Success) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            Vibration.vibrate(35);
          }
          break;
        default:
          Vibration.vibrate(25);
      }
    } else {
      Vibration.vibrate(20);
    }
  } catch (_) {
    try {
      Vibration.vibrate(20);
    } catch (_) {}
  }
}
