import React, { useRef, useEffect } from 'react';
import { Animated, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  animationType?: 'scale' | 'fade' | 'slide';
  delay?: number;
}

export default function AnimatedCard({
  children,
  style,
  onPress,
  disabled = false,
  animationType = 'scale',
  delay = 0
}: AnimatedCardProps) {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const slideValue = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const animate = () => {
      const animations = [];

      if (animationType === 'scale') {
        animations.push(
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 300,
            delay,
            useNativeDriver: true,
          })
        );
      }

      if (animationType === 'fade') {
        animations.push(
          Animated.timing(fadeValue, {
            toValue: 1,
            duration: 300,
            delay,
            useNativeDriver: true,
          })
        );
      }

      if (animationType === 'slide') {
        animations.push(
          Animated.timing(slideValue, {
            toValue: 0,
            duration: 300,
            delay,
            useNativeDriver: true,
          })
        );
      }

      Animated.parallel(animations).start();
    };

    animate();
  }, [animationType, delay, scaleValue, fadeValue, slideValue]);

  const handlePressIn = () => {
    if (!disabled) {
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const animatedStyle = {
    transform: [
      { scale: scaleValue },
      { translateY: slideValue }
    ],
    opacity: fadeValue,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.container, style, animatedStyle]}>
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Base styles will be applied via style prop
  },
});
