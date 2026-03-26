import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Switch,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { PropertyService } from '@/api/services/property.service';
import { AdminService } from '@/api/services/admin.service';
import type { PropertyTypeDTO, PropertySubTypeDTO, PropertyAmenityDTO } from '@/api/types/property.types';

type Tab = 'types' | 'amenities';

// ── Form State ───────────────────────────────────────────────────────────────
interface TypeForm { name: string; description: string; isActive: boolean; }
interface SubTypeForm { name: string; description: string; isActive: boolean; }
interface AmenityForm { name: string; category: string; iconClass: string; isActive: boolean; }

const EMPTY_TYPE: TypeForm = { name: '', description: '', isActive: true };
const EMPTY_SUBTYPE: SubTypeForm = { name: '', description: '', isActive: true };
const EMPTY_AMENITY: AmenityForm = { name: '', category: '', iconClass: '', isActive: true };

const PropertyConfigScreen = () => {
  const [tab, setTab] = useState<Tab>('types');
  const [types, setTypes] = useState<PropertyTypeDTO[]>([]);
  const [amenities, setAmenities] = useState<PropertyAmenityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTypeId, setExpandedTypeId] = useState<number | null>(null);

  // Type modal
  const [typeModal, setTypeModal] = useState(false);
  const [editingType, setEditingType] = useState<PropertyTypeDTO | null>(null);
  const [typeForm, setTypeForm] = useState<TypeForm>(EMPTY_TYPE);
  const [savingType, setSavingType] = useState(false);

  // SubType modal
  const [subTypeModal, setSubTypeModal] = useState(false);
  const [parentTypeId, setParentTypeId] = useState<number | null>(null);
  const [subTypeForm, setSubTypeForm] = useState<SubTypeForm>(EMPTY_SUBTYPE);
  const [savingSubType, setSavingSubType] = useState(false);

  // Amenity modal
  const [amenityModal, setAmenityModal] = useState(false);
  const [amenityForm, setAmenityForm] = useState<AmenityForm>(EMPTY_AMENITY);
  const [savingAmenity, setSavingAmenity] = useState(false);

  const loadData = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    Promise.all([
      PropertyService.getPropertyTypes(),
      PropertyService.getAmenities(),
    ])
      .then(([typesRes, amenitiesRes]) => {
        setTypes(typesRes.data.data ?? []);
        setAmenities(amenitiesRes.data.data ?? []);
      })
      .catch(err => console.error('Failed to load property config', err))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => { loadData(); }, []);

  // ── Type CRUD ──────────────────────────────────────────────────────────────
  const openAddType = () => {
    setEditingType(null);
    setTypeForm(EMPTY_TYPE);
    setTypeModal(true);
  };

  const openEditType = (type: PropertyTypeDTO) => {
    setEditingType(type);
    setTypeForm({ name: type.name, description: type.description ?? '', isActive: type.isActive ?? true });
    setTypeModal(true);
  };

  const submitType = () => {
    if (!typeForm.name.trim()) { Alert.alert('Validation', 'Name is required'); return; }
    setSavingType(true);
    const dto = { name: typeForm.name.trim(), description: typeForm.description.trim() || undefined, isActive: typeForm.isActive };
    const call = editingType
      ? AdminService.updatePropertyType(editingType.id, dto)
      : AdminService.createPropertyType(dto);
    call
      .then(res => {
        const updated = res.data.data;
        setTypes(prev =>
          editingType
            ? prev.map(t => t.id === editingType.id ? { ...t, ...updated } : t)
            : [...prev, updated]
        );
        setTypeModal(false);
      })
      .catch(err => Alert.alert('Error', err?.response?.data?.message ?? 'Failed to save'))
      .finally(() => setSavingType(false));
  };

  // ── SubType CRUD ───────────────────────────────────────────────────────────
  const openAddSubType = (typeId: number) => {
    setParentTypeId(typeId);
    setSubTypeForm(EMPTY_SUBTYPE);
    setSubTypeModal(true);
  };

  const submitSubType = () => {
    if (!subTypeForm.name.trim() || !parentTypeId) { Alert.alert('Validation', 'Name is required'); return; }
    setSavingSubType(true);
    AdminService.createSubType({
      name: subTypeForm.name.trim(),
      description: subTypeForm.description.trim() || undefined,
      propertyTypeId: parentTypeId,
      isActive: subTypeForm.isActive,
    })
      .then(res => {
        const newSub = res.data.data;
        setTypes(prev => prev.map(t =>
          t.id === parentTypeId
            ? { ...t, subTypes: [...(t.subTypes ?? []), newSub] }
            : t
        ));
        setSubTypeModal(false);
      })
      .catch(err => Alert.alert('Error', err?.response?.data?.message ?? 'Failed to save'))
      .finally(() => setSavingSubType(false));
  };

  // ── Amenity CRUD ───────────────────────────────────────────────────────────
  const submitAmenity = () => {
    if (!amenityForm.name.trim()) { Alert.alert('Validation', 'Name is required'); return; }
    setSavingAmenity(true);
    AdminService.createAmenity({
      name: amenityForm.name.trim(),
      category: amenityForm.category.trim() || undefined,
      iconClass: amenityForm.iconClass.trim() || undefined,
      isActive: amenityForm.isActive,
    })
      .then(res => {
        setAmenities(prev => [...prev, res.data.data]);
        setAmenityModal(false);
      })
      .catch(err => Alert.alert('Error', err?.response?.data?.message ?? 'Failed to save'))
      .finally(() => setSavingAmenity(false));
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const TypeRow = ({ item }: { item: PropertyTypeDTO }) => {
    const expanded = expandedTypeId === item.id;
    return (
      <View style={styles.typeCard}>
        <TouchableOpacity
          style={styles.typeHeader}
          onPress={() => setExpandedTypeId(expanded ? null : item.id)}
          activeOpacity={0.8}
        >
          <View style={styles.typeLeft}>
            <Ionicons
              name={expanded ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color={colors.textSecondary}
            />
            <View style={styles.typeInfo}>
              <Text style={styles.typeName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.typeDesc} numberOfLines={1}>{item.description}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.typeRight}>
            <View style={[styles.activeBadge, { backgroundColor: item.isActive ? '#27AE6020' : '#E74C3C20' }]}>
              <Text style={[styles.activeBadgeText, { color: item.isActive ? '#27AE60' : '#E74C3C' }]}>
                {item.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <Text style={styles.subCount}>{item.subTypes?.length ?? 0} sub</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={() => openEditType(item)}>
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => openAddSubType(item.id)}>
              <Ionicons name="add-circle-outline" size={18} color={colors.success} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {expanded && (
          <View style={styles.subTypeList}>
            {(item.subTypes ?? []).length === 0 ? (
              <Text style={styles.noSubText}>No sub-types yet</Text>
            ) : (
              item.subTypes!.map(sub => (
                <View key={sub.id} style={styles.subTypeRow}>
                  <Ionicons name="remove-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.subTypeName}>{sub.name}</Text>
                  {sub.isActive === false && (
                    <Text style={styles.inactiveTag}>Inactive</Text>
                  )}
                </View>
              ))
            )}
            <TouchableOpacity style={styles.addSubBtn} onPress={() => openAddSubType(item.id)}>
              <Ionicons name="add" size={14} color={colors.primary} />
              <Text style={styles.addSubBtnText}>Add Sub-type</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const AmenityRow = ({ item }: { item: PropertyAmenityDTO }) => (
    <View style={styles.amenityRow}>
      <View style={styles.amenityLeft}>
        <View style={styles.amenityIcon}>
          <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.amenityName}>{item.name}</Text>
          {item.category ? <Text style={styles.amenityCategory}>{item.category}</Text> : null}
        </View>
      </View>
      <View style={[styles.activeBadge, { backgroundColor: item.isActive !== false ? '#27AE6020' : '#E74C3C20' }]}>
        <Text style={[styles.activeBadgeText, { color: item.isActive !== false ? '#27AE60' : '#E74C3C' }]}>
          {item.isActive !== false ? 'Active' : 'Inactive'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'types' && styles.tabBtnActive]}
          onPress={() => setTab('types')}
        >
          <Text style={[styles.tabBtnText, tab === 'types' && styles.tabBtnTextActive]}>
            Property Types ({types.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'amenities' && styles.tabBtnActive]}
          onPress={() => setTab('amenities')}
        >
          <Text style={[styles.tabBtnText, tab === 'amenities' && styles.tabBtnTextActive]}>
            Amenities ({amenities.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add button */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>
          {tab === 'types' ? 'All Property Types' : 'All Amenities'}
        </Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => tab === 'types' ? openAddType() : setAmenityModal(true)}
        >
          <Ionicons name="add" size={18} color={colors.white} />
          <Text style={styles.addBtnText}>{tab === 'types' ? 'Add Type' : 'Add Amenity'}</Text>
        </TouchableOpacity>
      </View>

      {tab === 'types' ? (
        <FlatList
          data={types}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <TypeRow item={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="layers-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No property types yet</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={amenities}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <AmenityRow item={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="sparkles-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No amenities yet</Text>
            </View>
          }
        />
      )}

      {/* ── Type Modal ─────────────────────────────────────────────────────── */}
      <Modal visible={typeModal} animationType="slide" transparent onRequestClose={() => setTypeModal(false)}>
        <View style={styles.overlay}>
          <SafeAreaView style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{editingType ? 'Edit Type' : 'Add Property Type'}</Text>
              <TouchableOpacity onPress={() => setTypeModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Name *</Text>
            <TextInput
              style={styles.input}
              value={typeForm.name}
              onChangeText={v => setTypeForm(f => ({ ...f, name: v }))}
              placeholder="e.g. Residential"
            />
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={typeForm.description}
              onChangeText={v => setTypeForm(f => ({ ...f, description: v }))}
              placeholder="Optional description"
              multiline
              numberOfLines={3}
            />
            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Active</Text>
              <Switch
                value={typeForm.isActive}
                onValueChange={v => setTypeForm(f => ({ ...f, isActive: v }))}
                trackColor={{ true: colors.primary }}
              />
            </View>
            <TouchableOpacity style={[styles.saveBtn, savingType && styles.saveBtnDisabled]} onPress={submitType} disabled={savingType}>
              {savingType ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ── SubType Modal ──────────────────────────────────────────────────── */}
      <Modal visible={subTypeModal} animationType="slide" transparent onRequestClose={() => setSubTypeModal(false)}>
        <View style={styles.overlay}>
          <SafeAreaView style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Add Sub-type</Text>
              <TouchableOpacity onPress={() => setSubTypeModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {parentTypeId && (
              <Text style={styles.parentLabel}>
                Under: {types.find(t => t.id === parentTypeId)?.name}
              </Text>
            )}
            <Text style={styles.fieldLabel}>Name *</Text>
            <TextInput
              style={styles.input}
              value={subTypeForm.name}
              onChangeText={v => setSubTypeForm(f => ({ ...f, name: v }))}
              placeholder="e.g. Apartment"
            />
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={subTypeForm.description}
              onChangeText={v => setSubTypeForm(f => ({ ...f, description: v }))}
              placeholder="Optional description"
              multiline
              numberOfLines={3}
            />
            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Active</Text>
              <Switch
                value={subTypeForm.isActive}
                onValueChange={v => setSubTypeForm(f => ({ ...f, isActive: v }))}
                trackColor={{ true: colors.primary }}
              />
            </View>
            <TouchableOpacity style={[styles.saveBtn, savingSubType && styles.saveBtnDisabled]} onPress={submitSubType} disabled={savingSubType}>
              {savingSubType ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ── Amenity Modal ──────────────────────────────────────────────────── */}
      <Modal visible={amenityModal} animationType="slide" transparent onRequestClose={() => setAmenityModal(false)}>
        <View style={styles.overlay}>
          <SafeAreaView style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Add Amenity</Text>
              <TouchableOpacity onPress={() => setAmenityModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Name *</Text>
            <TextInput
              style={styles.input}
              value={amenityForm.name}
              onChangeText={v => setAmenityForm(f => ({ ...f, name: v }))}
              placeholder="e.g. Swimming Pool"
            />
            <Text style={styles.fieldLabel}>Category</Text>
            <TextInput
              style={styles.input}
              value={amenityForm.category}
              onChangeText={v => setAmenityForm(f => ({ ...f, category: v }))}
              placeholder="e.g. Outdoor, Indoor, Security"
            />
            <Text style={styles.fieldLabel}>Icon Class</Text>
            <TextInput
              style={styles.input}
              value={amenityForm.iconClass}
              onChangeText={v => setAmenityForm(f => ({ ...f, iconClass: v }))}
              placeholder="e.g. fa-swimming-pool (optional)"
            />
            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Active</Text>
              <Switch
                value={amenityForm.isActive}
                onValueChange={v => setAmenityForm(f => ({ ...f, isActive: v }))}
                trackColor={{ true: colors.primary }}
              />
            </View>
            <TouchableOpacity style={[styles.saveBtn, savingAmenity && styles.saveBtnDisabled]} onPress={submitAmenity} disabled={savingAmenity}>
              {savingAmenity ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: colors.primary },
  tabBtnText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  tabBtnTextActive: { color: colors.primary },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  listHeaderTitle: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    gap: 4,
  },
  addBtnText: { color: colors.white, fontSize: typography.fontSize.sm, fontWeight: '600' },

  list: { padding: spacing.md, gap: spacing.sm },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  emptyText: { fontSize: typography.fontSize.md, color: colors.textSecondary },

  // Type card
  typeCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  typeLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.sm },
  typeInfo: { flex: 1 },
  typeName: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text },
  typeDesc: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  typeRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  activeBadgeText: { fontSize: 11, fontWeight: '600' },
  subCount: { fontSize: 11, color: colors.textSecondary },
  iconBtn: { padding: 4 },

  subTypeList: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  subTypeName: { fontSize: typography.fontSize.sm, color: colors.text, flex: 1 },
  inactiveTag: { fontSize: 10, color: '#E74C3C', fontWeight: '600' },
  noSubText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, paddingVertical: spacing.sm },
  addSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  addSubBtnText: { fontSize: typography.fontSize.sm, color: colors.primary, fontWeight: '600' },

  // Amenity row
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 10,
    justifyContent: 'space-between',
  },
  amenityLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  amenityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityName: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text },
  amenityCategory: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontSize: typography.fontSize.xl, fontWeight: 'bold' },
  parentLabel: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: -spacing.xs },
  fieldLabel: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.text, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md,
    backgroundColor: colors.background,
  },
  textArea: { minHeight: 72, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  saveBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: typography.fontSize.md },
});

export default PropertyConfigScreen;
