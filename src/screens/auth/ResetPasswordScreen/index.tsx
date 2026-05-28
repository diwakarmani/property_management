import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { toast } from '@/utils/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { AuthService } from '@/api/services/auth.service';
import { resetPasswordSchema } from '@/utils/validation/authValidation';
import { colors, typography, spacing } from '@/theme';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '@/navigation/types';

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ResetPassword'
>;

type ResetPasswordScreenRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

interface Props {
  navigation: ResetPasswordScreenNavigationProp;
  route: ResetPasswordScreenRouteProp;
}

const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const { token } = route.params;
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: { newPassword: string }) => {
    try {
      await AuthService.resetPassword({ token, newPassword: data.newPassword });
      Alert.alert('Success', 'Password reset successfully', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reset password. Please try again.');
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.primary, colors.gradientMid, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.logoCircle}>
          <Ionicons name="lock-open" size={30} color={colors.primary} />
        </View>
        <Text style={styles.heroTitle}>Create New Password</Text>
        <Text style={styles.heroSubtitle}>Choose a strong password to protect your account.</Text>
      </LinearGradient>

      <View style={styles.card}>
        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onChange, value } }) => (
            <Input
              label="New Password"
              placeholder="Enter new password"
              value={value}
              onChangeText={onChange}
              error={errors.newPassword?.message}
              secureTextEntry
              leftIcon="lock-closed-outline"
              hint="Must be at least 8 characters"
            />
          )}
        />

        <View style={styles.strengthRow}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.success} />
          <Text style={styles.strengthText}>Use a mix of letters, numbers and symbols for a stronger password.</Text>
        </View>

        <Button onPress={handleSubmit(onSubmit)} style={styles.submitButton}>
          Reset Password
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  hero: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.white,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    textAlign: 'center',
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    marginHorizontal: spacing.md,
    marginTop: -24,
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.successSurface,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  strengthText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.success,
    lineHeight: 16,
  },
  submitButton: { marginTop: spacing.xs },
});

export default ResetPasswordScreen;