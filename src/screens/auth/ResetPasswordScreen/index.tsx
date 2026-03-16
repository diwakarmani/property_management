import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
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
  const [loading, setLoading] = React.useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: { newPassword: string }) => {
    setLoading(true);
    try {
      await AuthService.resetPassword({ token, newPassword: data.newPassword });
      Alert.alert(
        'Success',
        'Password reset successfully',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your new password</Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onChange, value } }) => (
            <Input
              label="New Password"
              placeholder="Enter new password (min 8 characters)"
              value={value}
              onChangeText={onChange}
              error={errors.newPassword?.message}
              secureTextEntry
            />
          )}
        />

        <Button
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.submitButton}
        >
          Reset Password
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    marginTop: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  form: {
    marginTop: spacing.md,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});

export default ResetPasswordScreen;