import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors } from '@/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  style?: any;
}

const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 20, style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[styles.skeleton, { width, height, opacity }, style]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.borderLight,
    borderRadius: 4,
  },
});

export default Skeleton;

// Usage:
export const PropertyCardSkeleton = () => (
  <View style={{ padding: 16 }}>
    <Skeleton height={200} style={{ marginBottom: 12 }} />
    <Skeleton width="80%" height={20} style={{ marginBottom: 8 }} />
    <Skeleton width="60%" height={16} />
  </View>
);