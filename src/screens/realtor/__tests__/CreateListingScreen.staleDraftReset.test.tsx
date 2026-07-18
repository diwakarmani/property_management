import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { useSelector } from 'react-redux';

import CreateListingScreen from '../CreateListingScreen';
import { PropertyService } from '@/api/services/property.service';
import { LocationService } from '@/api/services/location.service';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));

// Capture the callback registered via useFocusEffect so the test can invoke it directly to
// simulate the screen regaining focus (e.g. the user switching back to the "Create" tab),
// without needing a real NavigationContainer.
let focusCallback: (() => void) | undefined;
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void) => { focusCallback = cb; },
}));

jest.mock('@/api/services/property.service', () => ({
  PropertyService: { getPropertyTypes: jest.fn(), createProperty: jest.fn() },
}));

jest.mock('@/api/services/location.service', () => ({
  LocationService: { getLocalities: jest.fn(), getCities: jest.fn() },
}));

const SELECTED_CITY = { id: 1, name: 'Austin', stateName: 'TX' };
const PROPERTY_TYPE = { id: 7, name: 'Apartment' };

const setup = () => {
  (useSelector as unknown as jest.Mock).mockImplementation((selector: any) =>
    selector({ location: { selectedCity: SELECTED_CITY } })
  );
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  return { navigation };
};

describe('CreateListingScreen stale draft reset (Bug F)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    focusCallback = undefined;
    (PropertyService.getPropertyTypes as jest.Mock).mockResolvedValue({ data: { data: [PROPERTY_TYPE] } });
    (LocationService.getLocalities as jest.Mock).mockResolvedValue({ data: { data: [] } });
    (LocationService.getCities as jest.Mock).mockResolvedValue({ data: { data: [] } });
  });

  it('clears an abandoned draft when the screen regains focus (e.g. after switching tabs away and back)', async () => {
    const { navigation } = setup();
    const screen = render(<CreateListingScreen navigation={navigation} />);

    const titleInput = screen.getByPlaceholderText('e.g. 3BHK Apartment in Bandra');
    const priceInput = screen.getByPlaceholderText('e.g. 5000000');

    // User types a draft, then abandons it without submitting (e.g. taps another tab).
    fireEvent.changeText(titleInput, 'Abandoned Draft Listing');
    fireEvent.changeText(priceInput, '999999');
    expect(titleInput.props.value).toBe('Abandoned Draft Listing');

    // Screen is a bottom-tab route and stays mounted — simulate the user returning to it.
    expect(focusCallback).toBeDefined();
    focusCallback!();

    expect(titleInput.props.value).toBe('');
    expect(priceInput.props.value).toBe('');
  });

  it('repopulates city/state from the currently selected city after a focus reset', async () => {
    const { navigation } = setup();
    const screen = render(<CreateListingScreen navigation={navigation} />);

    // Simulate returning to the screen (e.g. after selectedCity changed elsewhere in the app).
    focusCallback!();

    fireEvent.changeText(screen.getByPlaceholderText('e.g. 3BHK Apartment in Bandra'), 'New Listing');
    fireEvent.changeText(
      screen.getByPlaceholderText(/Describe the property in detail/),
      'A description.'
    );
    fireEvent.changeText(screen.getByPlaceholderText('e.g. 5000000'), '500000');
    fireEvent.press(await screen.findByText('Apartment'));
    fireEvent.press(screen.getByText('Next Step'));

    // City is now a picker button (not a TextInput) so it renders the name as text, not a value.
    const cityButtonText = await screen.findByText('Austin');
    const stateInput = await screen.findByDisplayValue('TX');
    expect(cityButtonText).toBeTruthy();
    expect(stateInput).toBeTruthy();
  });
});
