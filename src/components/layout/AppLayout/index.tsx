import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import Header from '@/components/common/Header';
import { colors } from '@/theme';

interface LayoutConfig {
  title?: string;
  showBack?: boolean;
  showLocation?: boolean;
  showActions?: boolean;
  hideHeader?: boolean;
}

const SCREEN_CONFIGS: Record<string, LayoutConfig> = {
  HomeMain: { title:'Current Location',showLocation: true, showActions: true },
  ViewMore: { showBack: true, showActions: true },
  PropertyDetail: { showBack: true, showActions: true },
  Search: { title: 'Search', showLocation: false, showActions: true },
  FavoritesScreen: { title: 'Favorites', showActions: true },
  ProfileMain: { title: 'Profile', showLocation: false, showActions: false },
  EditProfile: { title: 'Edit Profile', showBack: true, showActions: false },
  Notifications: { title: 'Notifications', showBack: true, showActions: false },
  LocationSelection: { hideHeader: true }, // Has its own header
};

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const route = useRoute();
  const config = SCREEN_CONFIGS[route.name] || { showLocation: true, showActions: true };
  return (
     <SafeAreaView style={styles.safeArea}>
      {!config.hideHeader && <Header {...config} />}
      <View style={styles.content}>{children}</View>
     </SafeAreaView>
  );
};

const styles = StyleSheet.create({
   safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
});

export default AppLayout; 