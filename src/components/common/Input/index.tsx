import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  icon?:React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  secureTextEntry,
  icon,
  ...props
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <View style={[
            styles.input,
            ...(error ? [styles.inputError] : []),
            ...(secureTextEntry ? [styles.inputWithIcon] : []),
          ]}>
            {icon}
        <TextInput
          style={styles.inputText}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={isSecure}
          {...props}
          
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsSecure(!isSecure)}
          >
            <Ionicons
              name={isSecure ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        </View>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.lightGray,
  },
  inputText:{
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  inputWithIcon: {
    paddingRight: 50,
  },
  inputError: {
    borderColor: colors.error,
  },
  iconButton: {
    position: 'absolute',
    right: spacing.md,
    top: 15,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
});

export default Input;