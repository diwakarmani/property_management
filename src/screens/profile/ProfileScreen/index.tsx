import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { logout, clearActiveRoleAndReselect } from '@/store/slices/authSlice';
import { getAvailableRoles } from '@/utils/roleUtils';
import { colors, typography, spacing } from '@/theme';
import type { AppDispatch, RootState } from '@/store';

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={infoRowStyles.row}>
    <View style={infoRowStyles.iconWrap}>
      <Ionicons name={icon as any} size={15} color={colors.primary} />
    </View>
    <View style={infoRowStyles.text}>
      <Text style={infoRowStyles.label}>{label}</Text>
      <Text style={infoRowStyles.value}>{value}</Text>
    </View>
  </View>
);

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  label: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  value: { fontSize: typography.fontSize.md, color: colors.text, fontWeight: typography.fontWeight.medium, marginTop: 1 },
});

const ProfileScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  const handleHelpSupport = () => {
    const emailAddress = 'support@propertyapp.com';
    Alert.alert(
      'Help & Support',
      'Need help? Reach out to us and we\'ll get back to you shortly.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email Us',
          onPress: () =>
            Linking.openURL(`mailto:${emailAddress}?subject=Help%20%26%20Support`).catch(() =>
              Alert.alert('Email Us', `Send an email to:\n${emailAddress}`)
            ),
        },
      ]
    );
  };

  const openNotifications = () => {
    navigation.navigate('Notifications');
  };

  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  const isBuyer = user?.roles?.includes('BUYER') ?? false;
  const isMultiRole = getAvailableRoles(user?.roles).length > 1;

  const handleSwitchRole = () => {
    Alert.alert(
      'Switch Role',
      'This will take you back to the role selection screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: () => dispatch(clearActiveRoleAndReselect()),
        },
      ]
    );
  };

  const MENU_SECTIONS = [
    {
      title: 'Account',
      items: [
        { icon: 'create-outline',        label: 'Edit Profile',    onPress: () => navigation.navigate('EditProfile'),    color: colors.primary },
        { icon: 'lock-closed-outline',   label: 'Change Password', onPress: () => navigation.navigate('ChangePassword'), color: '#8B5CF6' },
        { icon: 'location-outline',      label: 'My Addresses',    onPress: () => navigation.navigate('Addresses'),      color: '#2980B9' },
        ...(isBuyer ? [{ icon: 'chatbubbles-outline', label: 'My Inquiries', onPress: () => navigation.navigate('SentInquiries'), color: '#0891B2' }] : []),
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications-outline', label: 'Notifications', onPress: openNotifications, color: '#F39C12' },
        { icon: 'help-circle-outline',   label: 'Help & Support', onPress: handleHelpSupport,                         color: '#27AE60' },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      <LinearGradient
        colors={[colors.primary, colors.gradientMid, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.heroName}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.heroEmail}>{user?.email}</Text>
        {user?.roles?.[0] && (
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{user.roles[0].replace(/_/g, ' ')}</Text>
          </View>
        )}
      </LinearGradient>

      {(user?.bio || user?.occupation || user?.website || user?.dateOfBirth || user?.phone) && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <View style={[styles.card, styles.infoCard]}>
            {!!user?.bio && (
              <View style={styles.bioWrap}>
                <Text style={styles.bioText}>{user.bio}</Text>
              </View>
            )}
            {!!user?.occupation && <InfoRow icon="briefcase-outline" label="Occupation" value={user.occupation} />}
            {!!user?.phone && <InfoRow icon="call-outline" label="Phone" value={user.phone} />}
            {!!user?.dateOfBirth && <InfoRow icon="calendar-outline" label="Date of Birth" value={user.dateOfBirth.slice(0, 10)} />}
            {!!user?.website && <InfoRow icon="globe-outline" label="Website" value={user.website} />}
          </View>
        </View>
      )}

      {MENU_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionLabel}>{section.title}</Text>
          <View style={styles.card}>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, i === section.items.length - 1 && styles.menuItemLast]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={styles.menuText}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.section}>
        <View style={styles.card}>
          {isMultiRole && (
            <TouchableOpacity style={styles.menuItem} onPress={handleSwitchRole} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primarySurface }]}>
                <Ionicons name="swap-horizontal-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.menuText}>Switch Role</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleLogout} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: colors.errorSurface }]}>
              <Ionicons name="log-out-outline" size={18} color={colors.error} />
            </View>
            <Text style={[styles.menuText, { color: colors.error }]}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.error + '80'} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  hero: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 36,
    paddingHorizontal: spacing.lg,
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.white,
  },
  heroName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
  },
  heroEmail: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  roleBadge: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  roleBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  section: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoCard: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: 0 },
  bioWrap: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: 2,
  },
  bioText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
});

export default ProfileScreen;
