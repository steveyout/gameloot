import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Vibration, Platform } from 'react-native';

// Synthesize lightweight offline WAV audio data URIs for crisp arcade feedback
function generateWav(sampleRate, duration, generateSample) {
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
  writeUInt32LE(28, sampleRate); // byte rate (sampleRate * numChannels * bitsPerSample/8)
  writeUInt16LE(32, 1);  // block align
  writeUInt16LE(34, 8);  // bits per sample
  writeStr(36, 'data');
  writeUInt32LE(40, numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.max(-1, Math.min(1, generateSample(t, i, numSamples)));
    bytes[44 + i] = Math.floor((sample + 1) * 127.5);
  }

  // Convert to base64
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
  return `data:audio/wav;base64,${base64}`;
}

// Sound Palette
const SOUND_DATA = {
  // Mechanical wheel peg click
  tick: generateWav(8000, 0.04, (t) => Math.sin(2 * Math.PI * 1100 * t) * Math.exp(-t * 90)),

  // Golden coin pickup chime
  coin: generateWav(8000, 0.18, (t) =>
    (t < 0.08 ? Math.sin(2 * Math.PI * 987 * t) : Math.sin(2 * Math.PI * 1318 * t)) * Math.exp(-t * 12)
  ),

  // Chest unlock / magical shimmer
  chestOpen: generateWav(8000, 0.35, (t) => {
    const freq = 440 + t * 900;
    return (Math.sin(2 * Math.PI * freq * t) * 0.7 + Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.3) * (1 - t / 0.35);
  }),

  // Winner Fanfare
  win: generateWav(8000, 0.45, (t) => {
    let freq = 523; // C5
    if (t > 0.1) freq = 659; // E5
    if (t > 0.2) freq = 784; // G5
    if (t > 0.3) freq = 1046; // C6
    return Math.sin(2 * Math.PI * freq * t) * Math.exp(-(t % 0.1) * 15);
  }),

  // Wheel spin whoosh
  spin: generateWav(8000, 0.25, (t) => {
    return (Math.random() * 2 - 1) * 0.4 * Math.sin(Math.PI * (t / 0.25));
  })
};

let soundEnabled = true;

export function setSoundEnabled(enabled) {
  soundEnabled = enabled;
}

export function isSoundEnabled() {
  return soundEnabled;
}

/**
 * Play synthesized sound effect
 * @param {'tick' | 'coin' | 'chestOpen' | 'win' | 'spin'} name
 */
export async function playSound(name) {
  if (!soundEnabled) return;
  const uri = SOUND_DATA[name];
  if (!uri) return;

  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1.0 }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (e) {
    // Fallback gracefully on environments without audio driver
  }
}

/**
 * Trigger tactile haptic vibration feedback
 * @param {'light' | 'medium' | 'heavy' | 'success'} type
 */
export async function triggerHaptic(type = 'light') {
  try {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        default:
          Vibration.vibrate(25);
      }
    }
  } catch (e) {
    try {
      Vibration.vibrate(20);
    } catch (_) {}
  }
}
