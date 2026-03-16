import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHomeFeed } from '@/store/slices/discoverySlice';
import { colors, spacing } from '@/theme';
import Header from '@/components/common/Header';
import PropertyCard from '@/components/property/PropertyCard';
import type { AppDispatch, RootState } from '@/store';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedCity, coordinates } = useSelector((state: RootState) => state.location);
  const { home, loading } = useSelector((state: RootState) => state.discovery);

  useEffect(() => {
    loadFeed();
  }, [selectedCity]);

  const loadFeed = () => {
    if (selectedCity) {
      dispatch(fetchHomeFeed({
        city: selectedCity.name,
        lat: coordinates.latitude || undefined,
        lng: coordinates.longitude || undefined,
      }));
    }
  };

  const renderSection = (title: string, data: any[], category: any) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {data.length > 0 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('ViewMore', { category, title })}
          >
            <Text style={styles.viewMore}>View More →</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
            style={styles.card}
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );

  return (
      <FlatList
        data={[1]}
        renderItem={() => (
          <SafeAreaView style={styles.safeArea}>
            {renderSection('Popular Properties', home.popular, 'POPULAR')}
            {renderSection('Recommended', home.recommended, 'RECOMMENDED')}
            {renderSection('Nearest', home.nearest, 'NEAREST')}
          </SafeAreaView>
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadFeed} />}
      />
  );
};

const styles = StyleSheet.create({
   safeArea: { flex: 1, backgroundColor: colors.background },
  section: { marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  viewMore: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  listContent: { paddingHorizontal: spacing.md },
  card: { marginRight: spacing.md },
});

export default HomeScreen;

// import React, { useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   FlatList,
//   TouchableOpacity,
//   RefreshControl,
// } from 'react-native';
// import { useDispatch, useSelector } from 'react-redux';
// import { Ionicons } from '@expo/vector-icons';
// import { fetchHomeFeed } from '@/store/slices/discoverySlice';
// import { colors, typography, spacing } from '@/theme';
// import PropertyCard from '@/components/property/PropertyCard';
// import type { AppDispatch, RootState } from '@/store';
// import type { PropertyCardDTO } from '@/api/types/discovery.types';
// import Header from '@/components/common/Header';

// const HomeScreen = ({ navigation }: any) => {
//   const dispatch = useDispatch<AppDispatch>();
//   const { selectedCity, selectedLocality, coordinates } = useSelector(
//     (state: RootState) => state.location
//   );
//   const { home, loading } = useSelector((state: RootState) => state.discovery);

//   useEffect(() => {
//     loadFeed();
//   }, [selectedCity]);

//   const loadFeed = () => {
//     if (selectedCity) {
//       dispatch(
//         fetchHomeFeed({
//           city: selectedCity.name,
//           lat: coordinates.latitude || undefined,
//           lng: coordinates.longitude || undefined,
//         })
//       );
//     }
//   };

//   const renderSection = (
//     title: string,
//     properties: PropertyCardDTO[],
//     category: 'POPULAR' | 'RECOMMENDED' | 'NEAREST'
//   ) => (
//     <View style={styles.section}>
//       <View style={styles.sectionHeader}>
//         <Text style={styles.sectionTitle}>{title}</Text>
//         {properties.length > 0 && (
//           <TouchableOpacity
//             onPress={() =>
//               navigation.navigate('ViewMore', {
//                 category,
//                 title,
//                 lat: coordinates.latitude,
//                 lng: coordinates.longitude,
//               })
//             }
//           >
//             <Text style={styles.viewMore}>View More →</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       {properties.length === 0 ? (
//         <Text style={styles.emptyText}>No properties found</Text>
//       ) : (
//         <FlatList
//           horizontal
//           data={properties}
//           keyExtractor={(item) => item.id.toString()}
//           renderItem={({ item }) => (
//             <PropertyCard
//               property={item}
//               onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
//               style={styles.card}
//             />
//           )}
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={styles.listContent}
//         />
//       )}
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <Header />
//       {/* Location Header */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.locationButton}
//           onPress={() => navigation.navigate('LocationSelection')}
//         >
//           <Ionicons name="location" size={20} color={colors.primary} />
//           <View style={styles.locationText}>
//             <Text style={styles.locationCity}>{selectedCity?.name}</Text>
//             {selectedLocality && (
//               <Text style={styles.locationLocality}>{selectedLocality.name}</Text>
//             )}
//           </View>
//           <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
//         </TouchableOpacity>

//         <TouchableOpacity
//           onPress={() => navigation.navigate('Notifications')}
//           style={styles.iconButton}
//         >
//           <Ionicons name="notifications-outline" size={24} color={colors.text} />
//           <View style={styles.badge}>
//             <Text style={styles.badgeText}>3</Text>
//           </View>
//         </TouchableOpacity>
//       </View>

//       {/* Search Bar */}
//       <TouchableOpacity
//         style={styles.searchBar}
//         onPress={() => navigation.navigate('Search')}
//       >
//         <Ionicons name="search" size={20} color={colors.textSecondary} />
//         <Text style={styles.searchPlaceholder}>Search properties...</Text>
//       </TouchableOpacity>

//       <ScrollView
//         style={styles.scrollView}
//         refreshControl={
//           <RefreshControl refreshing={loading} onRefresh={loadFeed} />
//         }
//       >
//         {renderSection('Popular Properties', home.popular, 'POPULAR')}
//         {renderSection('Recommended for You', home.recommended, 'RECOMMENDED')}
//         {renderSection('Nearest Properties', home.nearest, 'NEAREST')}
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.background,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: spacing.md,
//     backgroundColor: colors.white,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   locationButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: spacing.xs,
//   },
//   locationText: {
//     marginLeft: spacing.xs,
//   },
//   locationCity: {
//     fontSize: typography.fontSize.md,
//     fontWeight: typography.fontWeight.semibold,
//     color: colors.text,
//   },
//   locationLocality: {
//     fontSize: typography.fontSize.sm,
//     color: colors.textSecondary,
//   },
//   iconButton: {
//     padding: spacing.xs,
//     position: 'relative',
//   },
//   badge: {
//     position: 'absolute',
//     top: 0,
//     right: 0,
//     backgroundColor: colors.error,
//     borderRadius: 10,
//     minWidth: 18,
//     height: 18,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   badgeText: {
//     color: colors.white,
//     fontSize: 10,
//     fontWeight: typography.fontWeight.bold,
//   },
//   searchBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.backgroundSecondary,
//     margin: spacing.md,
//     padding: spacing.md,
//     borderRadius: 8,
//     gap: spacing.sm,
//   },
//   searchPlaceholder: {
//     fontSize: typography.fontSize.md,
//     color: colors.textSecondary,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   section: {
//     marginBottom: spacing.lg,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: spacing.md,
//     marginBottom: spacing.sm,
//   },
//   sectionTitle: {
//     fontSize: typography.fontSize.lg,
//     fontWeight: typography.fontWeight.bold,
//     color: colors.text,
//   },
//   viewMore: {
//     fontSize: typography.fontSize.sm,
//     color: colors.primary,
//     fontWeight: typography.fontWeight.medium,
//   },
//   listContent: {
//     paddingHorizontal: spacing.md,
//   },
//   card: {
//     marginRight: spacing.md,
//   },
//   emptyText: {
//     fontSize: typography.fontSize.md,
//     color: colors.textSecondary,
//     textAlign: 'center',
//     padding: spacing.xl,
//   },
// });

// export default HomeScreen;