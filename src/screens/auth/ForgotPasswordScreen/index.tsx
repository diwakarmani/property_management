import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { AuthService } from '@/api/services/auth.service';
import { forgotPasswordSchema } from '@/utils/validation/authValidation';
import { toast } from '@/utils/toast';
import { colors, typography, spacing } from '@/theme';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

interface Props {
  navigation: ForgotPasswordScreenNavigationProp;
}

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: { email: string }) => {
    try {
      await AuthService.forgotPassword(data.email);
      Alert.alert(
        'Email Sent',
        'A password reset link has been sent to your email address. Please check your inbox.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send reset link. Please try again.');
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.logoCircle}>
          <Ionicons name="key" size={30} color={colors.primary} />
        </View>
        <Text style={styles.heroTitle}>Forgot Password?</Text>
        <Text style={styles.heroSubtitle}>No worries! Enter your email and we'll send a reset link.</Text>
      </LinearGradient>

      <View style={styles.card}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email Address"
              placeholder="Enter your registered email"
              value={value}
              onChangeText={onChange}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />
          )}
        />

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={16} color={colors.info} />
          <Text style={styles.infoText}>
            We'll send you a secure link to reset your password. The link expires in 15 minutes.
          </Text>
        </View>

        <Button onPress={handleSubmit(onSubmit)} style={styles.submitButton}>
          Send Reset Link
        </Button>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
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
  backBtn: {
    position: 'absolute',
    top: 56,
    left: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.white,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.infoSurface,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#BEE3F8',
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.info,
    lineHeight: 16,
  },
  submitButton: { marginTop: spacing.xs },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerText: { fontSize: typography.fontSize.md, color: colors.textSecondary },
  loginLink: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
});

export default ForgotPasswordScreen;
