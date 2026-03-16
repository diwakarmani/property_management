import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { colors, spacing } from '@/theme';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import type { RootState } from '@/store';

const EditProfileScreen = ({ navigation }: any) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    // API call: PUT /api/users/me
    setTimeout(() => {
      Alert.alert('Success', 'Profile updated successfully');
      setLoading(false);
      navigation.goBack();
    }, 1000);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, value } }) => (
            <Input label="First Name" value={value} onChangeText={onChange} />
          )}
        />
        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, value } }) => (
            <Input label="Last Name" value={value} onChangeText={onChange} />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <Input label="Phone" value={value} onChangeText={onChange} keyboardType="phone-pad" />
          )}
        />
        <Button onPress={handleSubmit(onSubmit)} loading={loading} style={styles.button}>
          Save Changes
        </Button>
      </View>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  form: { padding: spacing.lg },
  button: { marginTop: spacing.md },
});

export default EditProfileScreen;