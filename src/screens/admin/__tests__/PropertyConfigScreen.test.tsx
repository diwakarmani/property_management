import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import PropertyConfigScreen from '../PropertyConfigScreen';
import { AdminService } from '@/api/services/admin.service';
import { PropertyService } from '@/api/services/property.service';

jest.mock('@/api/services/admin.service', () => ({
  AdminService: {
    createPropertyType: jest.fn(),
    updatePropertyType: jest.fn(),
    createSubType: jest.fn(),
    createAmenity: jest.fn(),
  },
}));
jest.mock('@/api/services/property.service', () => ({
  PropertyService: {
    getPropertyTypes: jest.fn(),
    getAmenities: jest.fn(),
  },
}));

const response = (data: unknown) => ({ data: { success: true, data } });

describe('PropertyConfigScreen response and active-state handling', () => {
  beforeEach(() => {
    (PropertyService.getPropertyTypes as jest.Mock).mockResolvedValue(response([]));
    (PropertyService.getAmenities as jest.Mock).mockResolvedValue(response([]));
  });

  it('adds a property type from the successful API response without showing an error', async () => {
    (AdminService.createPropertyType as jest.Mock).mockResolvedValue(response({
      id: 10, name: 'Townhouse', isActive: true, subTypes: [],
    }));
    const screen = render(<PropertyConfigScreen />);

    await waitFor(() => expect(screen.getByText('Add Type')).toBeTruthy());
    fireEvent.press(screen.getByText('Add Type'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Residential'), 'Townhouse');
    fireEvent.press(screen.getByText('Save'));

    await waitFor(() => expect(screen.getByText('Townhouse')).toBeTruthy());
    expect(AdminService.createPropertyType).toHaveBeenCalledWith({
      name: 'Townhouse', description: undefined, isActive: true,
    });
  });

  it('adds an amenity from the successful API response immediately', async () => {
    (AdminService.createAmenity as jest.Mock).mockResolvedValue(response({
      id: 12, name: 'Sauna', category: 'Indoor', isActive: true,
    }));
    const screen = render(<PropertyConfigScreen />);

    await waitFor(() => expect(screen.getByText('Amenities (0)')).toBeTruthy());
    fireEvent.press(screen.getByText('Amenities (0)'));
    fireEvent.press(screen.getByText('Add Amenity'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Swimming Pool'), 'Sauna');
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Outdoor, Indoor, Security'), 'Indoor');
    fireEvent.press(screen.getByText('Save'));

    await waitFor(() => expect(screen.getByText('Sauna')).toBeTruthy());
    expect(AdminService.createAmenity).toHaveBeenCalledWith({
      name: 'Sauna', category: 'Indoor', iconClass: undefined, isActive: true,
    });
  });

  it('preserves an inactive type when opening the edit form', async () => {
    (PropertyService.getPropertyTypes as jest.Mock).mockResolvedValue(response([
      { id: 20, name: 'Archived Type', isActive: false, subTypes: [] },
    ]));
    const screen = render(<PropertyConfigScreen />);

    await waitFor(() => expect(screen.getByText('Inactive')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Edit Archived Type'));
    expect(screen.getByRole('switch').props.value).toBe(false);
  });
});
