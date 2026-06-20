import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/theme';

interface OptimizedImageProps {
  uri: string;
  style?: any;

  resizeMode?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
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

  if (!uri || uri.trim() === '') {
    return <View style={[styles.container, style, styles.errorPlaceholder]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri }}
        style={[StyleSheet.absoluteFillObject, style]}
        contentFit={resizeMode}
        cachePolicy="memory-disk"
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
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
  container: {
    backgroundColor: colors.backgroundSecondary,
  },
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