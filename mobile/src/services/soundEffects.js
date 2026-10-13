import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Vibration, Platform } from 'react-native';

// Pure JavaScript Base64 encoder (Hermes & React Native safe - no Buffer or btoa dependencies)
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toBase64(bytes) {
  let result = '';
  let i = 0;
  const l = bytes.length;
  for (i = 2; i < l; i += 3) {
    result += BASE64_CHARS[bytes[i - 2] >> 2];
    result += BASE64_CHARS[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
    result += BASE64_CHARS[((bytes[i - 1] & 0x0f) << 2) | (bytes[i] >> 6)];
    result += BASE64_CHARS[bytes[i] & 0x3f];
  }
  if (i === l + 1) {
    result += BASE64_CHARS[bytes[l - 1] >> 2];
    result += BASE64_CHARS[(bytes[l - 1] & 0x03) << 4];
    result += '==';
  } else if (i === l) {
    result += BASE64_CHARS[bytes[l - 2] >> 2];
    result += BASE64_CHARS[((bytes[l - 2] & 0x03) << 4) | (bytes[l - 1] >> 4)];
    result += BASE64_CHARS[(bytes[l - 1] & 0x0f) << 2];
    result += '=';
  }
  return result;
}

// Synthesize lightweight offline WAV audio data URIs for crisp arcade feedback
function generateWav(sampleRate, duration, generateSample) {
  try {
    const numSamples = Math.floor(sampleRate * duration);
    const headerSize = 44;
    const totalSize = headerSize + numSamples;
    const bytes = new Uint8Array(totalSize);

    // RIFF header
    const writeStr = (offset, str) => {
      for (let i = 0; i < str.length; i++) bytes[offset + i] = str.charCodeAt(i);
    };
    const writeUInt32LE = (offset, val) => {
      bytes[offset] = val & 0xff;
      bytes[offset + 1] = (val >> 8) & 0xff;
      bytes[offset + 2] = (val >> 16) & 0xff;
      bytes[offset + 3] = (val >> 24) & 0xff;
    };
    const writeUInt16LE = (offset, val) => {
      bytes[offset] = val & 0xff;
      bytes[offset + 1] = (val >> 8) & 0xff;
    };

    writeStr(0, 'RIFF');
    writeUInt32LE(4, totalSize - 8);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    writeUInt32LE(16, 16); // subchunk1 size
    writeUInt16LE(20, 1);  // PCM format
    writeUInt16LE(22, 1);  // 1 channel (mono)
    writeUInt32LE(24, sampleRate);
    writeUInt32LE(28, sampleRate); // byte rate
    writeUInt16LE(32, 1);  // block align
    writeUInt16LE(34, 8);  // bits per sample
    writeStr(36, 'data');
    writeUInt32LE(40, numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const sample = Math.max(-1, Math.min(1, generateSample(t, i, numSamples)));
      bytes[44 + i] = Math.floor((sample + 1) * 127.5);
    }

    const base64 = toBase64(bytes);
    return `data:audio/wav;base64,${base64}`;
  } catch (err) {
    return null;
  }
}

// Lazy cache for synthesized sounds - NEVER generated at module evaluation time
const SOUND_CACHE = {};

function getSoundUri(name) {
  if (SOUND_CACHE[name]) return SOUND_CACHE[name];

  try {
    switch (name) {
      case 'tick':
        SOUND_CACHE.tick = generateWav(8000, 0.04, (t) => Math.sin(2 * Math.PI * 1100 * t) * Math.exp(-t * 90));
        break;
      case 'coin':
        SOUND_CACHE.coin = generateWav(8000, 0.18, (t) =>
          (t < 0.08 ? Math.sin(2 * Math.PI * 987 * t) : Math.sin(2 * Math.PI * 1318 * t)) * Math.exp(-t * 12)
        );
        break;
      case 'chestOpen':
        SOUND_CACHE.chestOpen = generateWav(8000, 0.35, (t) => {
          const freq = 440 + t * 900;
          return (Math.sin(2 * Math.PI * freq * t) * 0.7 + Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.3) * (1 - t / 0.35);
        });
        break;
      case 'win':
        SOUND_CACHE.win = generateWav(8000, 0.45, (t) => {
          let freq = 523;
          if (t > 0.1) freq = 659;
          if (t > 0.2) freq = 784;
          if (t > 0.3) freq = 1046;
          return Math.sin(2 * Math.PI * freq * t) * Math.exp(-(t % 0.1) * 15);
        });
        break;
      case 'spin':
        SOUND_CACHE.spin = generateWav(8000, 0.25, (t) => {
          return (Math.random() * 2 - 1) * 0.4 * Math.sin(Math.PI * (t / 0.25));
        });
        break;
      default:
        return null;
    }
  } catch (e) {
    return null;
  }

  return SOUND_CACHE[name];
}

let soundEnabled = true;

export function setSoundEnabled(enabled) {
  soundEnabled = !!enabled;
}

export function isSoundEnabled() {
  return soundEnabled;
}

/**
 * Play synthesized sound effect safely (never crashes app)
 * @param {'tick' | 'coin' | 'chestOpen' | 'win' | 'spin'} name
 */
export async function playSound(name) {
  if (!soundEnabled) return;

  try {
    const uri = getSoundUri(name);
    if (!uri) return;

    if (Audio && Audio.Sound) {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: 1.0 }
      );
      if (sound) {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status && status.didJustFinish) {
            sound.unloadAsync().catch(() => {});
          }
        });
      }
    }
  } catch (e) {
    // Graceful fallback - never throw unhandled rejection
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
  } catch (e) {
    try {
      Vibration.vibrate(20);
    } catch (_) {}
  }
}
