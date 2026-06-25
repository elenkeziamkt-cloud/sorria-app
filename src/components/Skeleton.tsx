import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { useAccessibleTheme } from '../hooks/useAccessibleTheme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.base,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

// Card skeleton pré-montado para a tela Explorar
export function LocationCardSkeleton() {
  const { colors: ac } = useAccessibleTheme();
  return (
    <View style={[styles.card, { backgroundColor: ac.surface }]}>
      <Skeleton width={80} height={20} borderRadius={6} style={{ marginBottom: 10 }} />
      <Skeleton height={20} borderRadius={6} style={{ marginBottom: 8 }} />
      <Skeleton width="70%" height={14} borderRadius={5} style={{ marginBottom: 12 }} />
      <View style={styles.cardFooter}>
        <Skeleton width={100} height={12} borderRadius={4} />
        <Skeleton width={60}  height={12} borderRadius={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#C0B8B0',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
