import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useSelector } from 'react-redux';

import CreateListingScreen from '../CreateListingScreen';
import { PropertyService } from '@/api/services/property.service';
import { LocationService } from '@/api/services/location.service';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('@react-navigation/native', () => ({ useFocusEffect: jest.fn() }));

jest.mock('@/api/services/property.service', () => ({
  PropertyService: { getPropertyTypes: jest.fn(), createProperty: jest.fn() },
}));

jest.mock('@/api/services/location.service', () => ({
  LocationService: { getCities: jest.fn(), getLocalities: jest.fn() },
}));

const PROPERTY_TYPE = { id: 7, name: 'Apartment' };
const AUSTIN = { id: 1, name: 'Austin', stateId: 10, stateName: 'TX' };
const HOUSTON = { id: 2, name: 'Houston', stateId: 10, stateName: 'TX' };
const HOUSTON_LOCALITY = { id: 9, name: 'Midtown', cityId: 2 };

// A seller who never went through the buyer-only LocationSelectionScreen has no Redux
// selectedCity — this is exactly the reported bug's starting state.
const setup = () => {
  (useSelector as unknown as jest.Mock).mockImplementation((selector: any) =>
    selector({ location: { selectedCity: null } })
  );
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  return { navigation };
};

const goToAddressStep = async (screen: ReturnType<typeof render>) => {
  fireEvent.changeText(screen.getByPlaceholderText('e.g. 3BHK Apartment in Bandra'), 'Test Listing');
  fireEvent.changeText(
    screen.getByPlaceholderText(/Describe the property in detail/),
    'A lovely test property description.'
  );
  fireEvent.changeText(screen.getByPlaceholderText('e.g. 5000000'), '500000');
  fireEvent.press(await screen.findByText('Apartment'));
  fireEvent.press(screen.getByText('Next Step'));
};

describe('CreateListingScreen city picker (Seller neighbourhood-selection bug)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (PropertyService.getPropertyTypes as jest.Mock).mockResolvedValue({ data: { data: [PROPERTY_TYPE] } });
    (LocationService.getCities as jest.Mock).mockResolvedValue({ data: { data: [AUSTIN, HOUSTON] } });
    (LocationService.getLocalities as jest.Mock).mockResolvedValue({ data: { data: [] } });
  });

  it('shows "select a city first" and no locality list when no city has been chosen', async () => {
    const { navigation } = setup();
    const screen = render(<CreateListingScreen navigation={navigation} />);
    await goToAddressStep(screen);

    fireEvent.press(screen.getByText('Select neighbourhood'));
    expect(await screen.findByText('Select a city first.')).toBeTruthy();
  });

  it('lets the user open a city picker, choose a city, and then pick a neighbourhood for it', async () => {
    (LocationService.getLocalities as jest.Mock).mockResolvedValue({ data: { data: [HOUSTON_LOCALITY] } });

    const { navigation } = setup();
    const screen = render(<CreateListingScreen navigation={navigation} />);
    await goToAddressStep(screen);

    // No "header" city selector exists elsewhere — this in-screen picker is the only entry point.
    fireEvent.press(screen.getByText('Select city'));
    fireEvent.press(await screen.findByText('Houston'));

    // City/State are populated from the picked city, and localities are fetched for it.
    await waitFor(() => expect(LocationService.getLocalities).toHaveBeenCalledWith(HOUSTON.id));
    expect(screen.getByDisplayValue('TX')).toBeTruthy();

    fireEvent.press(screen.getByText('Select neighbourhood'));
    fireEvent.press(await screen.findByText('Midtown'));

    expect(screen.getByText('Midtown')).toBeTruthy();
  });

  it('ignores a stale locality response that resolves after the user has already switched to a different city', async () => {
    const AUSTIN_LOCALITY = { id: 5, name: 'Downtown Austin', cityId: 1 };
    let resolveAustin!: (value: any) => void;
    let resolveHouston!: (value: any) => void;
    (LocationService.getLocalities as jest.Mock).mockImplementation((cityId: number) => {
      if (cityId === AUSTIN.id) return new Promise(res => { resolveAustin = res; });
      if (cityId === HOUSTON.id) return new Promise(res => { resolveHouston = res; });
      return Promise.resolve({ data: { data: [] } });
    });

    const { navigation } = setup();
    const screen = render(<CreateListingScreen navigation={navigation} />);
    await goToAddressStep(screen);

    // Pick Austin, then switch to Houston before Austin's request has resolved.
    fireEvent.press(screen.getByText('Select city'));
    fireEvent.press(await screen.findByText('Austin'));
    fireEvent.press(screen.getByText('Austin'));
    fireEvent.press(await screen.findByText('Houston'));

    // Houston's (the current city's) response arrives first; Austin's stale one arrives after.
    await act(async () => { resolveHouston({ data: { data: [HOUSTON_LOCALITY] } }); });
    await act(async () => { resolveAustin({ data: { data: [AUSTIN_LOCALITY] } }); });

    fireEvent.press(screen.getByText('Select neighbourhood'));
    expect(await screen.findByText('Midtown')).toBeTruthy();
    expect(screen.queryByText('Downtown Austin')).toBeNull();
  });
});
