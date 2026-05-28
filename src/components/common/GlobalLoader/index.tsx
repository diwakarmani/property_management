import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { requestTracker } from '@/utils/requestTracker';
import { colors } from '@/theme';

const GlobalLoader = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => requestTracker.subscribe(setVisible), []);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
});

export default GlobalLoader;
