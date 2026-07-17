import React, { useState, useRef, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  secureTextEntry?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  hint,
  secureTextEntry,
  leftIcon,
  rightIcon,
  onRightIconPress,
  onChangeText,
  style: externalStyle,
  multiline,
  ...props
}, ref) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);
  const toggleInProgressRef = useRef(false);
  const toggleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleToggleSecure = () => {
    toggleInProgressRef.current = true;
    setIsSecure(v => !v);
    // Cancel any still-pending timeout from a previous toggle before arming a new one — two
    // toggles in quick succession (e.g. a fast double-tap on the eye icon) previously raced:
    // the FIRST toggle's timer could fire and clear the flag before the SECOND toggle's own
    // window should have closed, reopening a gap where a spurious native onChangeText('') could
    // slip through unsuppressed and wipe out what the user had typed.
    if (toggleTimeoutRef.current) clearTimeout(toggleTimeoutRef.current);
    toggleTimeoutRef.current = setTimeout(() => { toggleInProgressRef.current = false; }, 100);
  };

  const handleChangeText = (text: string) => {
    // iOS fires onChangeText('') when secureTextEntry prop toggles — suppress it
    if (Platform.OS === 'ios' && secureTextEntry && toggleInProgressRef.current && text === '') return;
    onChangeText?.(text);
  };

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.border;

  const bgColor = error
    ? colors.errorSurface
    : isFocused
    ? colors.white
    : colors.background;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, isFocused && styles.labelFocused, !!error && styles.labelError]}>
          {label}
        </Text>
      )}
      <View style={[styles.inputContainer, { borderColor, backgroundColor: bgColor }]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={isFocused ? colors.primary : colors.textSecondary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          ref={ref}
          multiline={multiline}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            leftIcon && styles.inputWithLeft,
            (secureTextEntry || rightIcon) && styles.inputWithRight,
            externalStyle,
          ]}
          placeholderTextColor={colors.textLight}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChangeText={handleChangeText}
          {...props}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            style={styles.rightIconBtn}
            onPress={handleToggleSecure}
          >
            <Ionicons
              name={isSecure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity style={styles.rightIconBtn} onPress={onRightIconPress}>
            <Ionicons name={rightIcon} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.2,
  },
  labelFocused: {
    color: colors.primary,
  },
  labelError: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  leftIcon: {
    marginLeft: spacing.md,
  },
  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  inputMultiline: {
    height: undefined,
    minHeight: 52,
    paddingVertical: spacing.sm,
    textAlignVertical: 'top',
  },
  inputWithLeft: {
    paddingLeft: spacing.sm,
  },
  inputWithRight: {
    paddingRight: spacing.sm,
  },
  rightIconBtn: {
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    flex: 1,
  },
  hintText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 5,
  },
});

export default Input;
