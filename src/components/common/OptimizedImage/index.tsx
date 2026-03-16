import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import FastImage from 'react-native-fast-image';
import { colors } from '@/theme';

interface OptimizedImageProps {
  uri: string;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  placeholder?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  uri,
  style,
  resizeMode = 'cover',
  placeholder = true,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <FastImage
        source={{
          uri,
          priority: FastImage.priority.normal,
          cache: FastImage.cacheControl.immutable,
        }}
        style={[StyleSheet.absoluteFill, style]}
        resizeMode={FastImage.resizeMode[resizeMode]}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
      {loading && placeholder && (
        <View style={styles.placeholder}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      {error && <View style={styles.errorPlaceholder} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.backgroundSecondary },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  errorPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f0f0f0',
  },
});

export default OptimizedImage;