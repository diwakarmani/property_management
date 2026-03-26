import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';

const GroupAnalyticsScreen = () => (
  <View style={styles.container}>
    <Ionicons name="bar-chart-outline" size={64} color={colors.border} />
    <Text style={styles.title}>Group Analytics</Text>
    <Text style={styles.sub}>Coming soon</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: { fontSize: typography.fontSize.xl, fontWeight: 'bold', color: colors.text, marginTop: spacing.md },
  sub: { fontSize: typography.fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
});

export default GroupAnalyticsScreen;
