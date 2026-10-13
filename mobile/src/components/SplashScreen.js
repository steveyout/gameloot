import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ isReady, onFinish }) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0.6)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timer = null;
    try {
      // Pulse animation for the glow effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Subtle progress bar
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: false,
      }).start();

      // Auto transition after loading delay
      timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.04,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onFinish) onFinish();
        });
      }, 1600);
    } catch (e) {
      if (onFinish) onFinish();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Image
        source={require('../../assets/splash.png')}
        style={styles.splashBg}
        resizeMode="cover"
        fadeDuration={0}
      />

      {/* Cyberpunk subtle progress bar & loader */}
      <View style={styles.loaderContainer}>
        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Animated.Text style={[styles.loadingText, { opacity: pulseAnim }]}>
          INITIALIZING LOOT ENGINE...
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#090d16',
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashBg: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 48,
    left: 40,
    right: 40,
    alignItems: 'center',
  },
  progressBarTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#06b6d4',
    shadowColor: '#06b6d4',
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  loadingText: {
    color: '#06b6d4',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
});
