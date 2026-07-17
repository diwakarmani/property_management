import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PropertyConfigScreen from '../index';
import { AdminService } from '@/api/services/admin.service';

jest.mock('@/api/services/admin.service', () => ({
  AdminService: {
    getPropertyTypesAdmin: jest.fn(),
    getAmenitiesAdmin: jest.fn(),
    createPropertyType: jest.fn(),
    updatePropertyType: jest.fn(),
    deletePropertyType: jest.fn(),
    createSubType: jest.fn(),
    createAmenity: jest.fn(),
    updateAmenity: jest.fn(),
    deleteAmenity: jest.fn(),
  },
}));

// Net-new: Property Type had no delete action at all; Amenity had neither edit nor delete.
// The backend endpoints (DELETE /types/{id}, PUT/DELETE /amenities/{id}) previously didn't
// exist — this covers the newly-wired frontend actions calling them.
describe('PropertyConfigScreen — Type delete, Amenity edit/delete (net-new)', () => {
  const TYPE = { id: 1, name: 'Apartment', description: '', isActive: true, subTypes: [] };
  const AMENITY = { id: 9, name: 'Pool', category: 'Outdoor', iconClass: 'pool', isActive: true };

  beforeEach(() => {
    jest.clearAllMocks();
    (AdminService.getPropertyTypesAdmin as jest.Mock).mockResolvedValue({ data: { data: [TYPE] } });
    (AdminService.getAmenitiesAdmin as jest.Mock).mockResolvedValue({ data: { data: [AMENITY] } });
  });

  it('confirms and deletes a Property Type via the new delete button', async () => {
    (AdminService.deletePropertyType as jest.Mock).mockResolvedValue({ data: { data: null } });
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons: any) => {
      buttons.find((b: any) => b.text === 'Delete').onPress();
    });

    const screen = render(<PropertyConfigScreen />);
    await waitFor(() => expect(screen.getByText('Apartment')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Delete Apartment'));

    await waitFor(() => expect(AdminService.deletePropertyType).toHaveBeenCalledWith(1));
  });

  it('renders Edit and Delete actions on an amenity row', async () => {
    const screen = render(<PropertyConfigScreen />);
    await waitFor(() => expect(screen.getByText('Apartment')).toBeTruthy());
    fireEvent.press(screen.getByText(/Amenities/));
    await waitFor(() => expect(screen.getByText('Pool')).toBeTruthy());

    expect(screen.getByLabelText('Edit Pool')).toBeTruthy();
    expect(screen.getByLabelText('Delete Pool')).toBeTruthy();
  });

  it('opens the Edit Amenity modal pre-filled and calls updateAmenity on save', async () => {
    (AdminService.updateAmenity as jest.Mock).mockResolvedValue({
      data: { data: { ...AMENITY, name: 'Swimming Pool' } },
    });

    const screen = render(<PropertyConfigScreen />);
    await waitFor(() => expect(screen.getByText('Apartment')).toBeTruthy());
    fireEvent.press(screen.getByText(/Amenities/));
    await waitFor(() => expect(screen.getByText('Pool')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Edit Pool'));
    await waitFor(() => expect(screen.getByText('Edit Amenity')).toBeTruthy());
    expect(screen.getByDisplayValue('Pool')).toBeTruthy();

    fireEvent.changeText(screen.getByDisplayValue('Pool'), 'Swimming Pool');
    fireEvent.press(screen.getByText('Save'));

    await waitFor(() =>
      expect(AdminService.updateAmenity).toHaveBeenCalledWith(
        9,
        expect.objectContaining({ name: 'Swimming Pool' })
      )
    );
  });

  it('confirms and deletes an amenity via the new delete button', async () => {
    (AdminService.deleteAmenity as jest.Mock).mockResolvedValue({ data: { data: null } });
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons: any) => {
      buttons.find((b: any) => b.text === 'Delete').onPress();
    });

    const screen = render(<PropertyConfigScreen />);
    await waitFor(() => expect(screen.getByText('Apartment')).toBeTruthy());
    fireEvent.press(screen.getByText(/Amenities/));
    await waitFor(() => expect(screen.getByText('Pool')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Delete Pool'));

    await waitFor(() => expect(AdminService.deleteAmenity).toHaveBeenCalledWith(9));
  });
});
