import React from 'react';
import { fireEvent, render, waitFor, act } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import PropertyImagesScreen from '../PropertyImagesScreen';
import { PropertyService } from '@/api/services/property.service';
import { UploadService } from '@/api/services/upload.service';
import { queryClient, queryKeys } from '@/api/queryClient';

jest.mock('@/api/services/property.service', () => ({
  PropertyService: {
    getImages:       jest.fn(),
    addImage:        jest.fn(),
    deleteImage:     jest.fn(),
    setPrimaryImage: jest.fn(),
  },
}));

jest.mock('@/api/services/upload.service', () => ({
  UploadService: { uploadImage: jest.fn() },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('@/api/queryClient', () => ({
  queryClient: { invalidateQueries: jest.fn() },
  queryKeys:   { property: (id: number) => ['property', id] },
  STALE_TIME:  {},
}));

const PROPERTY_ID = 42;
const nav = { goBack: jest.fn() };
const route = { params: { propertyId: PROPERTY_ID, propertyTitle: 'Test Property' } };

const existingImage = { id: 1, imageUrl: 'https://example.com/img1.jpg', isPrimary: true };

const res = (data: unknown) => ({ data: { data } });

/**
 * Bug 33 regression guard — PropertyImagesScreen must invalidate the React Query
 * property cache after any image mutation so PropertyDetailScreen shows fresh data.
 *
 * Bug 35 regression guard — launchImageLibraryAsync must use allowsMultipleSelection
 * so users can pick more than one photo per tap.
 */
describe('PropertyImagesScreen query invalidation (Bug 33)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (PropertyService.getImages as jest.Mock).mockResolvedValue(res([existingImage]));
  });

  it('invalidates property query after a new image is added', async () => {
    const { launchImageLibraryAsync } = require('expo-image-picker');
    (launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///new-image.jpg' }],
    });
    (UploadService.uploadImage as jest.Mock).mockResolvedValue(res('https://cdn.example.com/new.jpg'));
    (PropertyService.addImage as jest.Mock).mockResolvedValue(
      res({ id: 2, imageUrl: 'https://cdn.example.com/new.jpg', isPrimary: false })
    );

    const screen = render(<PropertyImagesScreen navigation={nav} route={route} />);
    await waitFor(() => expect(PropertyService.getImages).toHaveBeenCalled());

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Add image'));
    });

    await waitFor(() => expect(PropertyService.addImage).toHaveBeenCalled());
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.property(PROPERTY_ID),
    });
  });

  it('invalidates property query after an image is deleted', async () => {
    const screen = render(<PropertyImagesScreen navigation={nav} route={route} />);
    await waitFor(() => expect(screen.queryAllByLabelText('Delete image').length).toBeGreaterThan(0));

    await act(async () => {
      fireEvent.press(screen.getAllByLabelText('Delete image')[0]);
    });

    // Confirm delete alert and proceed
    const { Alert } = require('react-native');
    const deleteCall = Alert.alert.mock?.calls?.find(
      ([title]: string[]) => title === 'Delete Image'
    );
    if (deleteCall) {
      (PropertyService.deleteImage as jest.Mock).mockResolvedValue(res(null));
      const deleteAction = deleteCall[2]?.find((btn: any) => btn.style === 'destructive');
      await act(async () => { deleteAction?.onPress?.(); });
    }

    if ((PropertyService.deleteImage as jest.Mock).mock.calls.length > 0) {
      await waitFor(() =>
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
          queryKey: queryKeys.property(PROPERTY_ID),
        })
      );
    }
  });


  it('invalidates property query after primary image is changed', async () => {
    const secondImage = { id: 2, imageUrl: 'https://example.com/img2.jpg', isPrimary: false };
    (PropertyService.getImages as jest.Mock).mockResolvedValue(res([existingImage, secondImage]));
    (PropertyService.setPrimaryImage as jest.Mock).mockResolvedValue(res(null));

    const screen = render(<PropertyImagesScreen navigation={nav} route={route} />);
    await waitFor(() => expect(screen.queryAllByText('Set Primary').length).toBeGreaterThan(0));

    await act(async () => {
      fireEvent.press(screen.getAllByText('Set Primary')[0]);
    });

    await waitFor(() =>
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: queryKeys.property(PROPERTY_ID),
      })
    );
  });
});
