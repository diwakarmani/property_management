import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { GroupService } from '@/api/services/group.service';

const AddMemberScreen = ({ navigation }: any) => {
  const [userId, setUserId] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('');
  const [monthlyTarget, setMonthlyTarget] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    const uid = parseInt(userId, 10);
    if (!userId.trim() || isNaN(uid) || uid <= 0) {
      Alert.alert('Required', 'Enter a valid User ID');
      return;
    }

    setSubmitting(true);
    GroupService.addMember({
      userId: uid,
      ...(commissionPercent && { commissionPercent: parseFloat(commissionPercent) }),
      ...(monthlyTarget && { monthlyTarget: parseFloat(monthlyTarget) }),
    })
      .then(() => {
        Alert.alert('Member Added', 'The realtor has been added to your group.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      })
      .catch(err => {
        const msg = err?.response?.data?.message ?? 'Failed to add member';
        Alert.alert('Error', msg);
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Add Member</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            The realtor must already be registered on the platform. Enter their User ID to add them to your group.
          </Text>
        </View>

        <Text style={styles.label}>User ID *</Text>
        <TextInput
          style={styles.input}
          value={userId}
          onChangeText={setUserId}
          placeholder="Enter realtor's User ID"
          keyboardType="numeric"
        />

        <Text style={styles.sectionHeader}>Optional Settings</Text>

        <Text style={styles.label}>Commission (%)</Text>
        <TextInput
          style={styles.input}
          value={commissionPercent}
          onChangeText={setCommissionPercent}
          placeholder="e.g. 2.5"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Monthly Target (₹)</Text>
        <TextInput
          style={styles.input}
          value={monthlyTarget}
          onChangeText={setMonthlyTarget}
          placeholder="e.g. 500000"
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="person-add-outline" size={18} color={colors.white} />
              <Text style={styles.primaryBtnText}>Add to Group</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40 },
  topBarTitle: { fontSize: typography.fontSize.lg, fontWeight: 'bold' },
  form: { flex: 1, padding: spacing.lg },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.primary + '10', borderRadius: 8,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  infoText: { fontSize: typography.fontSize.sm, color: colors.primary, flex: 1, lineHeight: 20 },
  sectionHeader: {
    fontSize: typography.fontSize.md, fontWeight: '700', color: colors.text,
    marginTop: spacing.xl, marginBottom: spacing.xs,
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md,
  },
  label: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md, color: colors.text,
  },
  primaryBtn: {
    backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', padding: spacing.md, borderRadius: 10,
    marginTop: spacing.xl, marginBottom: spacing.xl, gap: spacing.sm,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: colors.white, fontSize: typography.fontSize.md, fontWeight: '600' },
});

export default AddMemberScreen;
