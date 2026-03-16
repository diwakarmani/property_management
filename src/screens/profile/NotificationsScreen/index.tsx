import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@/theme';

const NotificationsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Notifications - Coming Soon</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: typography.fontSize.lg, color: colors.textSecondary },
});

export default NotificationsScreen;