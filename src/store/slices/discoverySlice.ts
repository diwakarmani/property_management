import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DiscoveryService } from '@/api/services/discovery.service';
import type { PropertyCardDTO, ViewMoreRequest } from '@/api/types/discovery.types';

interface DiscoveryState {
  home: {
    popular: PropertyCardDTO[];
    recommended: PropertyCardDTO[];
    nearest: PropertyCardDTO[];
  };
  viewMore: {
    category: 'POPULAR' | 'RECOMMENDED' | 'NEAREST' | null;
    properties: PropertyCardDTO[];
    page: number;
    hasMore: boolean;
  };
  loading: boolean;
  error: string | null;
}

const initialState: DiscoveryState = {
  home: {
    popular: [],
    recommended: [],
    nearest: [],
  },
  viewMore: {
    category: null,
    properties: [],
    page: 0,
    hasMore: true,
  },
  loading: false,
  error: null,
};

export const fetchHomeFeed = createAsyncThunk(
  'discovery/fetchHomeFeed',
  async (params: { city?: string; lat?: number; lng?: number }, { rejectWithValue }) => {
    try {
      const response = await DiscoveryService.getHomeFeed(params.city, params.lat, params.lng);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load properties');
    }
  }
);

export const fetchViewMore = createAsyncThunk(
  'discovery/fetchViewMore',
  async (params: ViewMoreRequest, { rejectWithValue }) => {
    try {
      const response = await DiscoveryService.viewMore(params);
      return { properties: response.data.data.content, page: params.page || 0 };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load more properties');
    }
  }
);

const discoverySlice = createSlice({
  name: 'discovery',
  initialState,
  reducers: {
    setViewMoreCategory: (state, action) => {
      state.viewMore.category = action.payload;
      state.viewMore.properties = [];
      state.viewMore.page = 0;
      state.viewMore.hasMore = true;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch home feed
      .addCase(fetchHomeFeed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHomeFeed.fulfilled, (state, action) => {
        state.loading = false;
        state.home = action.payload;
      })
      .addCase(fetchHomeFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch view more
      .addCase(fetchViewMore.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchViewMore.fulfilled, (state, action) => {
        state.loading = false;
        const { properties, page } = action.payload;
        
        if (page === 0) {
          state.viewMore.properties = properties;
        } else {
          state.viewMore.properties = [...state.viewMore.properties, ...properties];
        }
        
        state.viewMore.page = page;
        state.viewMore.hasMore = properties.length > 0;
      })
      .addCase(fetchViewMore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setViewMoreCategory, clearError } = discoverySlice.actions;
export default discoverySlice.reducer;