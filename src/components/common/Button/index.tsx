import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  onPress: () => void;
  children: string;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  onPress,
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  icon,
  textStyle
}) => {
  return (
    variant === 'primary' ?
      <TouchableOpacity
          onPress={onPress}
          disabled={disabled || loading}

          activeOpacity={0.7}
          style={{width:'100%'}}
        >
      <LinearGradient
        colors={[colors.secondary, colors.primary]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.button,
          variant === 'primary' && styles.primary,
          (disabled || loading) && styles.disabled,
          style,
        ]}
        >
        
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
            <Text style={[styles.text,textStyle]}>
              {children}
            </Text>
            {icon}
            </>
          )}
      </LinearGradient>
        </TouchableOpacity>

      :
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          styles.button,
          variant === 'secondary' && styles.secondary,
          variant === 'outline' && styles.outline,
          (disabled || loading) && styles.disabled,
          style,
        ]}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.white} />
        ) : (
          <>
          <Text style={[styles.text,textStyle, variant === 'outline' && styles.outlineText]}>
            {children}
          </Text>
          {icon}
          </>
        )}
      </TouchableOpacity>

  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.textSecondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gray,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.white,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  outlineText: {
    color: colors.text,
  },
});

export default Button;