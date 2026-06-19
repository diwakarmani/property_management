import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import type { AppDispatch, RootState } from '@/store';
import { selectRole, logout } from '@/store/slices/authSlice';
import { getAvailableRoles, ROLE_META, type RoleKey } from '@/utils/roleUtils';

const RoleSelectionScreen = () => {
  const dispatch    = useDispatch<AppDispatch>();
  const insets      = useSafeAreaInsets();
  const { user }    = useSelector((state: RootState) => state.auth);
  const slideAnim   = useRef(new Animated.Value(360)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;

  const availableRoles = getAvailableRoles(user?.roles);
  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || '?';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 260, useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0, tension: 65, friction: 10, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSelect = (role: RoleKey) => {
    dispatch(selectRole(role));
    // AppNavigator re-renders once activeRole is set → navigates to MainApp automatically
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Animated.View
        style={[
          styles.card,
          { paddingBottom: Math.max(insets.bottom, 16) + 12 },
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* User greeting */}
        <View style={styles.greeting}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.greetingText}>
            <Text style={styles.greetingHi}>Welcome back</Text>
            <Text style={styles.greetingName} numberOfLines={1}>
              {user?.firstName} {user?.lastName}
            </Text>
          </View>
        </View>

        {/* Divider + label */}
        <View style={styles.labelRow}>
          <View style={styles.labelLine} />
          <Text style={styles.labelText}>Continue as</Text>
          <View style={styles.labelLine} />
        </View>

        {/* Role options */}
        <View style={styles.roleList}>
          {availableRoles.map((roleKey) => {
            const meta = ROLE_META[roleKey];
            return (
              <TouchableOpacity
                key={roleKey}
                style={styles.roleRow}
                onPress={() => handleSelect(roleKey)}
                activeOpacity={0.76}
              >
                {/* Icon badge */}
                <View style={[styles.roleIcon, { backgroundColor: meta.color + '1A' }]}>
                  <Ionicons name={meta.icon as any} size={22} color={meta.color} />
                </View>

                {/* Text */}
                <View style={styles.roleInfo}>
                  <Text style={styles.roleLabel}>{meta.label}</Text>
                  <Text style={styles.roleDesc} numberOfLines={1}>{meta.description}</Text>
                </View>

                {/* Arrow */}
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,10,30,0.55)',
    justifyContent: 'flex-end',
  },

  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 30,
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 20,
  },

  // Greeting
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 22,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  greetingText: { flex: 1 },
  greetingHi: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  greetingName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: 2,
  },

  // Divider label
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 14,
  },
  labelLine: { flex: 1, height: 1, backgroundColor: colors.borderLight },
  labelText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Role list
  roleList: { gap: 10 },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 68,
  },
  roleIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  roleInfo: { flex: 1, minWidth: 0 },
  roleLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  roleDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 3,
  },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 12,
  },
  signOutText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
});

export default RoleSelectionScreen;
