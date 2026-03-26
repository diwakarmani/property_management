import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { AuthService } from '@/api/services/auth.service';

type Status = 'loading' | 'success' | 'error';

const VerifyEmailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { token } = (route.params ?? {}) as { token?: string };
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification link is invalid or expired.');
      return;
    }
    AuthService.verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      })
      .catch(err => {
        setStatus('error');
        const msg =
          err?.response?.data?.message ?? 'Verification failed. The link may have expired.';
        setMessage(msg);
      });
  }, [token]);

  return (
    <View style={styles.container}>
      {status === 'loading' ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.subtext}>Verifying your email...</Text>
        </>
      ) : status === 'success' ? (
        <>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          <Text style={styles.title}>Email Verified!</Text>
          <Text style={styles.subtext}>{message}</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.btnText}>Go to Login</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Ionicons name="close-circle" size={72} color={colors.error} />
          <Text style={styles.title}>Verification Failed</Text>
          <Text style={styles.subtext}>{message}</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.btnText}>Back to Login</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  subtext: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  btnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: typography.fontSize.md,
  },
});

export default VerifyEmailScreen;
