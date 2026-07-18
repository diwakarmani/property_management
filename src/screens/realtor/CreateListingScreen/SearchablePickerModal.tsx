import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';

interface SearchablePickerModalProps<T> {
  visible: boolean;
  title: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (text: string) => void;
  onClose: () => void;
  data: T[];
  keyExtractor: (item: T) => string;
  getLabel: (item: T) => string;
  matchesSearch: (item: T, search: string) => boolean;
  isSelected: (item: T) => boolean;
  onSelect: (item: T) => void;
  icon: keyof typeof Ionicons.glyphMap;
  emptyText: string;
}

// Shared by the City and Neighbourhood pickers in CreateListingScreen — same
// overlay/sheet/search/list structure, parameterized by data + selection semantics.
function SearchablePickerModal<T>({
  visible, title, searchPlaceholder, searchValue, onSearchChange, onClose,
  data, keyExtractor, getLabel, matchesSearch, isSelected, onSelect, icon, emptyText,
}: SearchablePickerModalProps<T>) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.modalSearch}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textLight}
            value={searchValue}
            onChangeText={onSearchChange}
            autoFocus
          />
          {data.length === 0 ? (
            <View style={styles.modalEmpty}>
              <Text style={styles.modalEmptyText}>{emptyText}</Text>
            </View>
          ) : (
            <FlatList
              data={data.filter(item => !searchValue || matchesSearch(item, searchValue))}
              keyExtractor={keyExtractor}
              renderItem={({ item }) => {
                const selected = isSelected(item);
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, selected && styles.modalItemSelected]}
                    onPress={() => onSelect(item)}
                  >
                    <Ionicons name={icon} size={16} color={colors.primary} />
                    <Text style={styles.modalItemText}>{getLabel(item)}</Text>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '75%', paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  modalTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text },
  modalSearch: {
    margin: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    fontSize: typography.fontSize.md, color: colors.text, backgroundColor: colors.background,
  },
  modalEmpty: { alignItems: 'center', padding: spacing.xl },
  modalEmptyText: { color: colors.textSecondary, fontSize: typography.fontSize.sm, textAlign: 'center' },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight,
  },
  modalItemSelected: { backgroundColor: colors.primarySurface },
  modalItemText: { flex: 1, fontSize: typography.fontSize.md, color: colors.text },
});

export default SearchablePickerModal;
