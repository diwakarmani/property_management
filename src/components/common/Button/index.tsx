import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '@/theme';

interface ButtonProps {
  onPress: () => void;
  children: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({
  onPress,
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  size = 'md',
}) => {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  const sizeStyle = {
    sm: { height: 40, borderRadius: 10, paddingHorizontal: spacing.md },
    md: { height: 52, borderRadius: 14, paddingHorizontal: spacing.lg },
    lg: { height: 58, borderRadius: 16, paddingHorizontal: spacing.xl },
  }[size];

  const fontSizeMap = { sm: typography.fontSize.sm, md: typography.fontSize.md, lg: typography.fontSize.lg };

  if (isPrimary && !isDisabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[{ borderRadius: sizeStyle.borderRadius, overflow: 'hidden' }, style]}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, { height: sizeStyle.height, paddingHorizontal: sizeStyle.paddingHorizontal }]}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={[styles.text, { fontSize: fontSizeMap[size] }]}>{children}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        { height: sizeStyle.height, borderRadius: sizeStyle.borderRadius, paddingHorizontal: sizeStyle.paddingHorizontal },
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        isPrimary && styles.primaryDisabled,
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={
          variant === 'outline' ? colors.primary :
          variant === 'ghost' ? colors.primary :
          colors.white
        } />
      ) : (
        <Text style={[
          styles.text,
          { fontSize: fontSizeMap[size] },
          variant === 'outline' && styles.outlineText,
          variant === 'ghost' && styles.ghostText,
          variant === 'danger' && styles.dangerText,
        ]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: colors.primarySurface,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.error,
  },
  primaryDisabled: {
    backgroundColor: colors.primary,
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
  outlineText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.primary,
  },
  dangerText: {
    color: colors.white,
  },
});

export default Button;
