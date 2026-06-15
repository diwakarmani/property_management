import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as Location from 'expo-location';
import LocationSelectionScreen from '../LocationSelectionScreen';
import { confirmLocation, fetchCities, fetchLocalities, selectCity, setNearMe } from '@/store/slices/locationSlice';

jest.mock('react-redux', () => ({ useDispatch: jest.fn(), useSelector: jest.fn() }));
jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 1 },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));
jest.mock('@/store/slices/locationSlice', () => ({
  fetchCities: jest.fn(() => ({ type: 'location/fetchCities' })),
  fetchLocalities: jest.fn((id) => ({ type: 'location/fetchLocalities', payload: id })),
  selectCity: jest.fn((city) => ({ type: 'location/selectCity', payload: city })),
  toggleLocality: jest.fn(),
  setNearMe: jest.fn(),
  confirmLocation: jest.fn(() => ({ type: 'location/confirmLocation' })),
  MAX_LOCALITIES: 5,
}));

describe('LocationSelectionScreen', () => {
  beforeAll(() => jest.useFakeTimers());
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => act(() => jest.runOnlyPendingTimers()));
  afterAll(() => jest.useRealTimers());

  it('loads cities and dispatches the selected city and locality request', () => {
    const dispatch = jest.fn();
    const losAngeles = {
      id: 7, name: 'Los Angeles', stateId: 3, stateName: 'California',
      latitude: 34.05, longitude: -118.24,
    };
    (useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => selector({
      location: {
        cities: [losAngeles], localities: [], selectedCity: null, selectedLocalities: [],
        loading: false, loadingLocalities: false, error: null,
      },
    }));

    const screen = render(<LocationSelectionScreen navigation={{ canGoBack: () => false }} />);
    expect(fetchCities).toHaveBeenCalled();
    fireEvent.press(screen.getByText('Select a city'));
    fireEvent.press(screen.getByText('Los Angeles'));

    expect(selectCity).toHaveBeenCalledWith(losAngeles);
    expect(fetchLocalities).toHaveBeenCalledWith(7);
    expect(dispatch).toHaveBeenCalledWith({ type: 'location/selectCity', payload: losAngeles });
    expect(dispatch).toHaveBeenCalledWith({ type: 'location/fetchLocalities', payload: 7 });
  });

  it('lets a buyer continue immediately after selecting a city', () => {
    const dispatch = jest.fn();
    (useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => selector({
      location: {
        cities: [], localities: [], selectedCity: { id: 7, name: 'Los Angeles' },
        selectedLocalities: [], loading: false, loadingLocalities: false, error: null,
      },
    }));

    const screen = render(<LocationSelectionScreen navigation={{ canGoBack: () => false }} />);
    fireEvent.press(screen.getByText('Continue'));

    expect(confirmLocation).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'location/confirmLocation' });
  });

  it('captures near-me coordinates and confirms the location in one action', async () => {
    const dispatch = jest.fn();
    (useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
    (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => selector({
      location: {
        cities: [], localities: [], selectedCity: null, selectedLocalities: [],
        loading: false, loadingLocalities: false, error: null,
      },
    }));
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 37.785834, longitude: -122.406417 },
    });

    const screen = render(<LocationSelectionScreen navigation={{ canGoBack: () => false }} />);
    await act(async () => {
      fireEvent.press(screen.getByText('Search properties near me'));
    });
    expect(setNearMe).toHaveBeenCalledWith({ latitude: 37.785834, longitude: -122.406417 });
    expect(confirmLocation).toHaveBeenCalled();
  });
});
