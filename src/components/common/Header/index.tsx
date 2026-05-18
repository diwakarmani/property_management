import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Modal, Pressable, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import type { RootState } from '@/store';
import { LinearGradient } from 'expo-linear-gradient';
import { menuItems } from '@/utils/constants/menuItem';


interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showLocation?: boolean;
  showActions?: boolean;
}

const Header = ({ title, showBack, showLocation = true, showActions = true }: HeaderProps) => {
  const navigation = useNavigation();
  const { selectedCity } = useSelector((state: RootState) => state.location);
  const { user } = useSelector((state: RootState) => state.auth);
  console.log("user",user)
  const [isSideMenuVisible, setIsSideMenuVisible] = useState<boolean>(false);
  const slideAnim = useRef(
    new Animated.Value(-Dimensions.get('window').width * 0.75)
  ).current;

  // Open menu
  const openMenu = () => {
    setIsSideMenuVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Close menu
  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -Dimensions.get('window').width * 0.75,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsSideMenuVisible(false));
  };
  const handleMenuSelect = (path: string) => {
    navigation.navigate(path as never)
    closeMenu()
  }
  return (
    <>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.left}>
          {showBack ? (
            <TouchableOpacity onPress={() => navigation.goBack()} >
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
          ) : <TouchableOpacity onPress={() => openMenu()}><Ionicons name='menu' color={colors.white} size={25} /></TouchableOpacity>}
        </View>
        <View style={styles.middle}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
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
      <Modal
        visible={isSideMenuVisible}
        animationType="none"
        transparent
      // onRequestClose={() => closeMenu()}
      >
        <View style={styles.menuContainer}>
          {/* Tap outside to close */}
          <Pressable
            style={styles.overlay}
            onPress={() => closeMenu()}
          />
          <Animated.View
            style={[
              styles.sideMenuContainer,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {/* Menu content */}
            <View style={styles.menuTopContainer}><LinearGradient colors={[colors.primary, colors.secondary]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 1 }} style={styles.sideMenuTopIcon}>
              <Ionicons name='business' color={colors.white} size={25} />
            </LinearGradient>
              <Text style={styles.sideMenuHeaderText}>Company Name</Text>
            </View>
            <View style={styles.horizontalLine}></View>
            <View style={styles.menuContainer}><Text style={styles.menuText}>Menu</Text><TouchableOpacity onPress={() => closeMenu()}><Ionicons name='chevron-back-outline' color={colors.darkGray} size={20} /></TouchableOpacity></View>
            {menuItems.menu.map((item: { name: string, icon: string, path: string }) => <TouchableOpacity onPress={() => handleMenuSelect(item.path)} key={item.name} style={styles.innerMenuOption}><Ionicons name={item.icon as never} color={colors.darkGray} size={16} /><Text style={styles.innerMenuOptionText}>{item.name}</Text><Ionicons name='chevron-forward-outline' color={colors.white} size={20} /></TouchableOpacity>)}
            <View style={styles.horizontalLine}></View>
            <View style={styles.menuContainer}><Text style={styles.menuText}>Account</Text><TouchableOpacity onPress={() => closeMenu()}><Ionicons name='chevron-back-outline' color={colors.darkGray} size={20} /></TouchableOpacity></View>
            {menuItems.account.map((item: { name: string, icon: string, path: string }) => <TouchableOpacity onPress={() => handleMenuSelect(item.path)} key={item.name} style={styles.innerMenuOption}><Ionicons name={item.icon as never} color={colors.darkGray} size={16} /><Text style={styles.innerMenuOptionText}>{item.name}</Text><Ionicons name='chevron-forward-outline' color={colors.white} size={20} /></TouchableOpacity>)}

<View style={styles.bottomUserContainer}></View>
          </Animated.View>


        </View>
      </Modal>
    </>
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
  middle: { justifyContent: 'center', alignItems: 'center', gap: 4 },
  sideMenuContainer: {
    position: 'relative',
    left: 0,
    top: 0,
    height: Dimensions.get('screen').height,
    width: Dimensions.get('screen').width * 0.75,
    backgroundColor: colors.white,
    padding: spacing.lg
  },
  overlay: {
    backgroundColor: colors.overlay,
    ...StyleSheet.absoluteFillObject,
  },
  menuTopContainer: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.md,
    alignItems: 'center'
  },
  sideMenuTopIcon: {
    padding: spacing.sm,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  sideMenuHeaderText: {
    fontSize: typography.fontSize.xl,
    color: colors.text,
    fontWeight: typography.fontWeight.bold
  }, horizontalLine: {
    height: 2,
    backgroundColor: colors.darkGray,
    marginVertical: 10,
  },
  menuContainer: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginVertical: spacing.sm
  },
  menuText: {
    fontWeight: typography.fontWeight.medium,
    color: colors.darkGray,
    fontSize: typography.fontSize.sm
  }, innerMenuOption: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md
  },
  innerMenuOptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text
  },
  bottomUserContainer:{
    borderRadius:8,
    borderWidth:1,
    borderColor:colors.border,
    position:'relative',
    bottom:0,
    padding:spacing.md,
    flexDirection:'row',
    alignItems:'center'
  }
});

export default Header;