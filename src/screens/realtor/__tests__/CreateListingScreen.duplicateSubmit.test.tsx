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
  LocationService: { getLocalities: jest.fn() },
}));

const SELECTED_CITY = { id: 1, name: 'Austin', stateName: 'TX' };
const PROPERTY_TYPE = { id: 7, name: 'Apartment' };
const LOCALITY = { id: 5, name: 'Downtown' };

const setup = () => {
  (useSelector as unknown as jest.Mock).mockImplementation((selector: any) =>
    selector({ location: { selectedCity: SELECTED_CITY } })
  );
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  return { navigation };
};

// Advances the form through steps 1-3 up to the final "Save as Draft" submit button on step 4.
const advanceToSubmitStep = async (screen: ReturnType<typeof render>) => {
  fireEvent.changeText(screen.getByPlaceholderText('e.g. 3BHK Apartment in Bandra'), 'Test Listing');
  fireEvent.changeText(
    screen.getByPlaceholderText(/Describe the property in detail/),
    'A lovely test property description.'
  );
  fireEvent.changeText(screen.getByPlaceholderText('e.g. 5000000'), '500000');
  fireEvent.press(await screen.findByText('Apartment'));
  fireEvent.press(screen.getByText('Next Step'));

  fireEvent.changeText(await screen.findByPlaceholderText('Building name, street, area'), '123 Main St');
  fireEvent.press(screen.getByText('Select neighbourhood'));
  fireEvent.press(await screen.findByText('Downtown'));
  fireEvent.press(screen.getByText('Next Step'));

  fireEvent.press(await screen.findByText('Next Step'));

  return screen.findByText('Save as Draft');
};

describe('CreateListingScreen submit guard (Bug 9)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (PropertyService.getPropertyTypes as jest.Mock).mockResolvedValue({ data: { data: [PROPERTY_TYPE] } });
    (LocationService.getLocalities as jest.Mock).mockResolvedValue({ data: { data: [LOCALITY] } });
  });

  it('calls createProperty exactly once even when the submit button is pressed twice before the response resolves', async () => {
    let resolveCreate!: (value: any) => void;
    (PropertyService.createProperty as jest.Mock).mockReturnValue(
      new Promise((res) => { resolveCreate = res; })
    );

    const { navigation } = setup();
    const screen = render(<CreateListingScreen navigation={navigation} />);
    const submitButton = await advanceToSubmitStep(screen);

    // Fire both taps synchronously, before any state update / re-render can commit —
    // this is exactly the race the async `disabled={submitting}` guard alone cannot close.
    fireEvent.press(submitButton);
    fireEvent.press(submitButton);

    await act(async () => {
      resolveCreate({ data: { data: { title: 'Test Listing' } } });
    });

    expect(PropertyService.createProperty).toHaveBeenCalledTimes(1);
  });

  it('allows a fresh submission again after a prior submit completes', async () => {
    (PropertyService.createProperty as jest.Mock).mockResolvedValue({
      data: { data: { title: 'Test Listing' } },
    });

    const { navigation } = setup();
    const screen = render(<CreateListingScreen navigation={navigation} />);
    const submitButton = await advanceToSubmitStep(screen);

    fireEvent.press(submitButton);
    await waitFor(() => expect(PropertyService.createProperty).toHaveBeenCalledTimes(1));
  });
});
