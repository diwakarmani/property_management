import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing } from '@/theme';
import { PropertyService } from '@/api/services/property.service';
import { UploadService } from '@/api/services/upload.service';
import type { PropertyImageDTO } from '@/api/types/property.types';

const PropertyImagesScreen = ({ navigation, route }: any) => {
  const propertyId: number = route?.params?.propertyId;
  const propertyTitle: string = route?.params?.propertyTitle ?? 'Property';

  const [images, setImages] = useState<PropertyImageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchImages = () => {
    PropertyService.getImages(propertyId)
      .then(res => setImages(res.data.data ?? []))
      .catch(err => console.error('Failed to load images', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchImages(); }, [propertyId]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll access is required to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    const localUri = result.assets[0].uri;
    setUploading(true);

    UploadService.uploadImage(localUri)
      .then(uploadRes => {
        const imageUrl = uploadRes.data.data;
        const isFirst = images.length === 0;
        return PropertyService.addImage(propertyId, imageUrl, isFirst);
      })
      .then(addRes => {
        setImages(prev => [...prev, addRes.data.data]);
      })
      .catch(err => {
        const msg = err?.response?.data?.message ?? 'Failed to upload image';
        Alert.alert('Upload Failed', msg);
      })
      .finally(() => setUploading(false));
  };

  const handleSetPrimary = (image: PropertyImageDTO) => {
    PropertyService.setPrimaryImage(propertyId, image.id!)
      .then(() => {
        setImages(prev => prev.map(img => ({ ...img, isPrimary: img.id === image.id })));
      })
      .catch(() => Alert.alert('Error', 'Failed to set primary image'));
  };

  const handleDelete = (image: PropertyImageDTO) => {
    Alert.alert('Delete Image', 'Remove this image from the listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          PropertyService.deleteImage(propertyId, image.id!)
            .then(() => setImages(prev => prev.filter(img => img.id !== image.id)))
            .catch(() => Alert.alert('Error', 'Failed to delete image'));
        },
      },
    ]);
  };

  const ImageCard = ({ item }: { item: PropertyImageDTO }) => (
    <View style={styles.imageCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
      {item.isPrimary && (
        <View style={styles.primaryBadge}>
          <Text style={styles.primaryBadgeText}>PRIMARY</Text>
        </View>
      )}
      <View style={styles.imageActions}>
        {!item.isPrimary && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleSetPrimary(item)}>
            <Ionicons name="star-outline" size={16} color={colors.primary} />
            <Text style={styles.actionBtnText}>Set Primary</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>Images</Text>
        <TouchableOpacity
          style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
          onPress={handlePickImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="add" size={22} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.subtitleBar}>
        <Text style={styles.subtitle}>{propertyTitle}</Text>
        <Text style={styles.imageCount}>{images.length} image{images.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={images}
        keyExtractor={item => String(item.id ?? item.imageUrl)}
        renderItem={({ item }) => <ImageCard item={item} />}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>No images yet</Text>
            <Text style={styles.emptySub}>Tap + to add your first photo</Text>
            <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickImage} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={18} color={colors.white} />
                  <Text style={styles.addPhotoBtnText}>Add Photo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  uploadBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadBtnDisabled: { opacity: 0.5 },
  subtitleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  subtitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary, flex: 1 },
  imageCount: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  list: { padding: spacing.md },
  row: { justifyContent: 'space-between', marginBottom: spacing.md },
  imageCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  image: { width: '100%', height: 140 },
  primaryBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  primaryBadgeText: { color: colors.white, fontSize: 10, fontWeight: typography.fontWeight.bold },
  imageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flex: 1,
    justifyContent: 'center',
  },
  deleteBtn: {
    borderColor: colors.error,
    flex: 0,
    paddingHorizontal: 8,
    backgroundColor: colors.errorSurface,
  },
  actionBtnText: { fontSize: 11, color: colors.primary, fontWeight: typography.fontWeight.semibold },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text, marginTop: spacing.sm },
  emptySub: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 14,
    marginTop: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  addPhotoBtnText: { color: colors.white, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.md },
});

export default PropertyImagesScreen;
