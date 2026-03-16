import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import type { RootState } from '@/store';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showLocation?: boolean;
  showActions?: boolean;
}

const Header = ({ title, showBack, showLocation = true, showActions = true }: HeaderProps) => {
  const navigation = useNavigation();
  const { selectedCity } = useSelector((state: RootState) => state.location);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : showLocation ? (
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => navigation.navigate('LocationSelection' as never)}
          >
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={styles.city}>{selectedCity?.name || 'Select'}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
        {title && <Text style={styles.title}>{title}</Text>}
      </View>

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications' as never)}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Profile' as never)}
          >
            <Ionicons name="person-circle-outline" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  locationButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  city: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text },
  title: { fontSize: typography.fontSize.lg, fontWeight: '600', color: colors.text },
  actions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: { padding: spacing.xs, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: 'bold' },
});

export default Header;