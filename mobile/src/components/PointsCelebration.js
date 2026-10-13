import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Modal } from 'react-native';
import { Sparkles, Coins } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { playSound, triggerHaptic } from '../services/soundEffects';

export default function PointsCelebration({ points, title, visible, onComplete }) {
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    playSound('coin');
    triggerHaptic('success');

    translateY.setValue(40);
    opacity.setValue(0);
    scale.setValue(0.5);
    rotate.setValue(0);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.spring(scale, {
        toValue: 1.15,
        friction: 4,
        tension: 80,
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: -30,
        duration: 1600,
        useNativeDriver: true
      }),
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true
      })
    ]).start(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true
      }).start(() => {
        if (onComplete) onComplete();
      });
    });
  }, [visible, points]);

  if (!visible || !points) return null;

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '8deg']
  });

  return (
    <Modal
      visible={visible && points > 0}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={onComplete}
    >
      <View pointerEvents="none" style={styles.container}>
        <Animated.View
          style={[
            styles.badgeWrapper,
            {
              opacity,
              transform: [
                { translateY },
                { scale },
                { rotate: spin }
              ]
            }
          ]}
        >
          <LinearGradient
            colors={['#f59e0b', '#d97706', '#b45309']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pill}
          >
            <Coins size={22} color="#ffffff" style={styles.coinIcon} />
            <View>
              <Text style={styles.ptsText}>+{points} PTS!</Text>
              {title ? <Text style={styles.subText}>{title}</Text> : null}
            </View>
            <Sparkles size={18} color="#fef08a" style={styles.sparkleIcon} />
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeWrapper: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 25
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fef08a'
  },
  coinIcon: {
    marginRight: 10
  },
  sparkleIcon: {
    marginLeft: 10
  },
  ptsText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3
  },
  subText: {
    color: '#fef3c7',
    fontSize: 11,
    fontWeight: '700'
  }
});
