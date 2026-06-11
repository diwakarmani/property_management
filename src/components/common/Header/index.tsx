import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import type { RootState } from '@/store';

const ADMIN_ROLES = ['SUPER_ADMIN', 'REALTOR'];

const Header = () => {
  const navigation = useNavigation();
  const { selectedCity } = useSelector((state: RootState) => state.location);
  const { user } = useSelector((state: RootState) => state.auth);

  const isAdminRole = user?.roles?.some((r: string) => ADMIN_ROLES.includes(r)) ?? false;
  const openNotifications = () => {
    // Navigate to the Notifications screen within the Profile stack.
    // Using navigate('Profile', { screen: 'Notifications' }) switches to the
    // Profile tab and pushes Notifications onto its stack, so Back returns to
    // ProfileMain cleanly — avoids the hidden Notifications tab which has no
    // back stack and breaks the tab state.
    (navigation as any).navigate('Profile', { screen: 'Notifications' });
  };

  return (
    <View style={styles.container}>
      {/* Left — location pill (buyer) or brand (admin/realtor) */}
      {isAdminRole ? (
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Ionicons name="home" size={16} color={colors.white} />
          </View>
          <Text style={styles.brandName}>PropertyApp</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.locationPill}
          onPress={() => navigation.navigate('LocationSelection' as never)}
          activeOpacity={0.75}
        >
          <View style={styles.locationIconWrap}>
            <Ionicons name="location" size={12} color={colors.white} />
          </View>
          <Text style={styles.cityText} numberOfLines={1}>
            {selectedCity?.name || 'Select city'}
          </Text>
          <Ionicons name="chevron-down" size={13} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Right — notifications + profile */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionWrap}
          onPress={openNotifications}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <View style={styles.actionBtn}>
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionWrap}
          onPress={() => (navigation as any).navigate('Profile', { screen: 'ProfileMain' })}
          accessibilityRole="button"
          accessibilityLabel="Profile"
        >
          <View style={styles.avatarBtn}>
            <Ionicons name="person" size={16} color={colors.white} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },

  // Buyer — location pill
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 180,
  },
  locationIconWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },

  // Admin/realtor — brand
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },

  // Right actions
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  actionWrap: { position: 'relative' },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Header;
