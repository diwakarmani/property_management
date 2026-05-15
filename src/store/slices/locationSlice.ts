import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LocationService } from '@/api/services/location.service';
import type { City, Locality } from '@/api/types/location.type';
import { set, get } from '@/utils/helpers/storage';
import { MOCK_CITIES } from '@/utils/mockData';

interface LocationState {
  hasSelected: boolean;
  selectedCity: City | null;
  selectedLocality: Locality | null;
  coordinates: {
    latitude: number | null;
    longitude: number | null;
  };
  cities: City[];
  localities: Locality[];
  searchingLocalities: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: LocationState = {
  hasSelected: false,
  selectedCity: null,
  selectedLocality: null,
  coordinates: { latitude: null, longitude: null },
  cities: [],
  localities: [],
  searchingLocalities: false,
  loading: false,
  error: null,
};

export const fetchCities = createAsyncThunk(
  'location/fetchCities',
  async (_, { rejectWithValue }) => {
    if (process.env.EXPO_PUBLIC_HAS_MOCK_DATA) return MOCK_CITIES;

    try {
      const response = await LocationService.getCities();
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch cities'
      );
    }
  }
);

export const searchLocalities = createAsyncThunk(
  'location/searchLocalities',
  async (
    { cityId, keyword }: { cityId: number; keyword: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await LocationService.searchLocalities({
        cityId,
        keyword,
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to search localities'
      );
    }
  }
);

/**
 * Load saved location from AsyncStorage
 */
export const loadSavedLocation = createAsyncThunk(
  'location/loadSavedLocation',
  async () => {
    const saved = await get('selectedLocation');
    return saved;
  }
);

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    selectCity: (state, action: PayloadAction<City>) => {
      state.selectedCity = action.payload;
      state.coordinates.latitude = action.payload.latitude;
      state.coordinates.longitude = action.payload.longitude;

      // reset locality when city changes
      state.selectedLocality = null;
      state.localities = [];
    },

    selectLocality: (state, action: PayloadAction<Locality | null>) => {
      state.selectedLocality = action.payload;

      if (action.payload?.latitude && action.payload?.longitude) {
        state.coordinates.latitude = action.payload.latitude;
        state.coordinates.longitude = action.payload.longitude;
      }
    },

    confirmLocation: (state) => {
      state.hasSelected = true;

      if (state.selectedCity) {
        set('selectedLocation', {
          city: state.selectedCity,
          locality: state.selectedLocality,
          coordinates: state.coordinates,
        });
      }
    },

    clearLocalities: (state) => {
      state.localities = [];
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /**
       * Fetch Cities
       */
      .addCase(fetchCities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchCities.fulfilled, (state, action) => {
        state.loading = false;
        state.cities = action.payload;
      })

      .addCase(fetchCities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /**
       * Search Localities
       */
      .addCase(searchLocalities.pending, (state) => {
        state.searchingLocalities = true;
      })

      .addCase(searchLocalities.fulfilled, (state, action) => {
        state.searchingLocalities = false;
        state.localities = action.payload;
      })

      .addCase(searchLocalities.rejected, (state, action) => {
        state.searchingLocalities = false;
        state.error = action.payload as string;
      })

      /**
       * Load saved location from storage
       */
      .addCase(loadSavedLocation.fulfilled, (state, action) => {
        const saved = action.payload;
        if (saved) {
          state.hasSelected = true;
          state.selectedCity = saved.city;

          state.selectedLocality = saved.locality;
          state.coordinates = saved.coordinates;
        }
      });
  },
});

export const {
  selectCity,
  selectLocality,
  confirmLocation,
  clearLocalities,
  clearError,
} = locationSlice.actions;

export default locationSlice.reducer;