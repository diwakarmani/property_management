import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '@/store/slices/authSlice';
import { colors, typography, spacing } from '@/theme';
import type { AppDispatch, RootState } from '@/store';

const ProfileScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  const MenuItem = ({ icon, title, onPress, color }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={24} color={color || colors.text} />
      <Text style={[styles.menuText, color && { color }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={colors.primary} />
        </View>
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <MenuItem icon="create-outline" title="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
        <MenuItem icon="notifications-outline" title="Notifications" onPress={() => navigation.navigate('Notifications')} />
        <MenuItem icon="settings-outline" title="Settings" onPress={() => {}} />
        <MenuItem icon="help-circle-outline" title="Help & Support" onPress={() => {}} />
        <MenuItem icon="log-out-outline" title="Logout" onPress={handleLogout} color={colors.error} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', padding: spacing.xl, backgroundColor: colors.white },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: { fontSize: typography.fontSize.xl, fontWeight: 'bold', color: colors.text },
  email: { fontSize: typography.fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
  section: { marginTop: spacing.md, backgroundColor: colors.white },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  menuText: { flex: 1, fontSize: typography.fontSize.md, color: colors.text },
});

export default ProfileScreen;