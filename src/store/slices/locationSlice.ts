import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LocationService } from '@/api/services/location.service';
import type { City, Locality } from '@/api/types/location.type';
import { set, get } from '@/utils/helpers/storage';

export type LocationMode = 'city' | 'nearMe';

export const MAX_LOCALITIES = 3;

interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

interface LocationState {
  hasSelected: boolean;
  mode: LocationMode;
  selectedCity: City | null;

  selectedLocalities: Locality[];
  coordinates: Coordinates;
  cities: City[];

  localities: Locality[];
  loadingLocalities: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: LocationState = {
  hasSelected: false,
  mode: 'city',
  selectedCity: null,
  selectedLocalities: [],
  coordinates: { latitude: null, longitude: null },
  cities: [],
  localities: [],
  loadingLocalities: false,
  loading: false,
  error: null,
};

export const fetchCities = createAsyncThunk(
  'location/fetchCities',
  async (_, { rejectWithValue }) => {
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

export const fetchLocalities = createAsyncThunk(
  'location/fetchLocalities',
  async (cityId: number, { rejectWithValue }) => {
    try {
      const response = await LocationService.getLocalities(cityId);
      return response.data.data ?? [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load areas'
      );
    }
  }
);

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
      state.mode = 'city';
      state.selectedCity = action.payload;
      state.coordinates = {
        latitude: action.payload.latitude,
        longitude: action.payload.longitude,
      };

      state.selectedLocalities = [];
      state.localities = [];
      state.loadingLocalities = true;
    },

    toggleLocality: (state, action: PayloadAction<Locality>) => {
      const exists = state.selectedLocalities.some((l) => l.id === action.payload.id);
      if (exists) {
        state.selectedLocalities = state.selectedLocalities.filter(
          (l) => l.id !== action.payload.id
        );
      } else if (state.selectedLocalities.length < MAX_LOCALITIES) {
        state.selectedLocalities.push(action.payload);
      }
    },

    setNearMe: (state, action: PayloadAction<Coordinates>) => {
      state.mode = 'nearMe';
      state.coordinates = action.payload;
      state.selectedCity = null;
      state.selectedLocalities = [];
      state.localities = [];
    },

    setCoordinates: (state, action: PayloadAction<Coordinates>) => {
      state.coordinates = action.payload;
      state.mode = 'nearMe';
    },

    confirmLocation: (state) => {

      if (state.mode === 'city' && !state.selectedCity) return;
      if (state.mode === 'nearMe' && state.coordinates.latitude == null) return;

      state.hasSelected = true;
      set('selectedLocation', {
        mode: state.mode,
        city: state.selectedCity,
        localities: state.selectedLocalities,
        coordinates: state.coordinates,
      });
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
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

      .addCase(fetchLocalities.pending, (state) => {
        state.loadingLocalities = true;
        state.error = null;
      })
      .addCase(fetchLocalities.fulfilled, (state, action) => {
        state.loadingLocalities = false;
        state.localities = action.payload ?? [];
      })
      .addCase(fetchLocalities.rejected, (state, action) => {
        state.loadingLocalities = false;
        state.error = action.payload as string;
      })

      .addCase(loadSavedLocation.fulfilled, (state, action) => {
        const saved = action.payload;
        if (saved && (saved.city || saved.coordinates?.latitude != null)) {
          state.hasSelected = true;
          state.mode = saved.mode ?? 'city';
          state.selectedCity = saved.city ?? null;

          state.selectedLocalities =
            saved.localities ?? (saved.locality ? [saved.locality] : []);
          state.coordinates = saved.coordinates ?? {
            latitude: null,
            longitude: null,
          };
        }
      });
  },
});

export const { selectCity, toggleLocality, setNearMe, setCoordinates, confirmLocation, clearError } =
  locationSlice.actions;

export default locationSlice.reducer;
