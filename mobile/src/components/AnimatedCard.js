import React, { useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * AnimatedCard
 * Provides tactile micro-interactions with smooth spring scaling on press,
 * elevating cards with a responsive, modern game-feel.
 * Properly forwards flex styles to the outer Animated.View container.
 */
export default function AnimatedCard({
  children,
  onPress,
  disabled = false,
  style,
  containerStyle,
  scaleTo = 0.97,
  activeOpacity = 0.9,
  ...props
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: scaleTo,
      friction: 6,
      tension: 100,
      useNativeDriver: true
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true
    }).start();
  };

  const flattened = StyleSheet.flatten(style) || {};
  const hasFlex = flattened.flex !== undefined;

  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        hasFlex && { flex: flattened.flex },
        containerStyle
      ]}
    >
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={style}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
