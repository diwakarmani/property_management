import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { DiscoveryService } from '@/api/services/discovery.service';
import Header from '@/components/common/Header';
import PropertyCard from '@/components/property/PropertyCard';
import { colors, spacing } from '@/theme';
import type { RootState } from '@/store';
import { SafeAreaView } from 'react-native-safe-area-context';

const ViewMoreScreen = ({ navigation }: any) => {
  const route = useRoute();
  const { category, title } = route.params as any;
  const { coordinates } = useSelector((state: RootState) => state.location);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    setLoading(true);
    const response = await DiscoveryService.viewMore({
      category,
      lat: coordinates.latitude || undefined,
      lng: coordinates.longitude || undefined,
      page: 0,
      size: 20,
    });
    setProperties(response.data.data.content);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* <Header title={title} showBack /> */}
      <FlatList
        data={properties}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
            style={styles.card}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
   safeArea: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  row: { justifyContent: 'space-between', marginBottom: spacing.md },
  card: { width: '48%' },
});

export default ViewMoreScreen;