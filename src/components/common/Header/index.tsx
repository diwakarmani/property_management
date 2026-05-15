import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import type { RootState } from '@/store';
import { LinearGradient } from 'expo-linear-gradient';

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
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : <TouchableOpacity ><Ionicons name='menu' color={colors.white} size={25} /></TouchableOpacity>}
      </View>
      <View style={styles.middle}>
     { title ? <Text style={styles.title}>{title}</Text> : null}
      {showLocation ?
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => navigation.navigate('LocationSelection' as never)}
        >
          <Ionicons name="location" size={14} color={colors.white} />
          <Text style={styles.city}>{selectedCity?.name || 'Select'}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.white} />
        </TouchableOpacity> : null}</View>
      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications' as never)}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.white} />
            <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Profile' as never)}
          >
            <Ionicons name="person-circle-outline" size={28} color={colors.text} />
          </TouchableOpacity> */}
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderBottomColor: colors.border,
    borderRadius: 20,
    marginHorizontal: spacing.sm,

  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  locationButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  city: { fontSize: typography.fontSize.sm, fontWeight: '400', color: colors.white },
  title: { fontSize: typography.fontSize.lg, fontWeight: '500', color: colors.white },
  actions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: { padding: spacing.xs, position: 'relative', backgroundColor: colors.overlayLight, borderRadius: 50, borderWidth: 1, borderColor: 'transparent', paddingBottom: spacing.sm, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
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
  middle:{justifyContent:'center',alignItems:'center',gap:4}
});

export default Header;