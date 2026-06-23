import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import Header from '@/components/common/Header';
import { colors } from '@/theme';

const HIDE_HEADER_SCREENS = new Set(['LocationSelection', 'EditProfile', 'ChangePassword', 'Addresses']);

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const route = useRoute();
  const showHeader = !HIDE_HEADER_SCREENS.has(route.name);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {showHeader && <Header />}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
});

export default AppLayout;
