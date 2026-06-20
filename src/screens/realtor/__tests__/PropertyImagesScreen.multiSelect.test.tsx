

import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
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

const PROPERTY_ID = 99;
const nav = { goBack: jest.fn() };
const route = { params: { propertyId: PROPERTY_ID, propertyTitle: 'Multi-Image Property' } };
const res = (data: unknown) => ({ data: { data } });

describe('PropertyImagesScreen — multi-select upload (Bug 35)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (PropertyService.getImages as jest.Mock).mockResolvedValue(res([]));
  });

  it('passes allowsMultipleSelection: true to launchImageLibraryAsync', async () => {
    const picker = require('expo-image-picker');
    let capturedOptions: any;
    (picker.launchImageLibraryAsync as jest.Mock).mockImplementation(async (opts: any) => {
      capturedOptions = opts;
      return { canceled: true };
    });

    const screen = render(<PropertyImagesScreen navigation={nav} route={route} />);

    await waitFor(() => expect(screen.getByText('Add Photo')).toBeTruthy());

    await act(async () => { fireEvent.press(screen.getByText('Add Photo')); });

    expect(capturedOptions).toBeDefined();
    expect(capturedOptions.allowsMultipleSelection).toBe(true);

    expect(capturedOptions.allowsEditing).toBeUndefined();
  });

  it('uploads all selected assets and calls invalidateQueries once', async () => {
    const picker = require('expo-image-picker');
    (picker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'file:///photo-a.jpg' },
        { uri: 'file:///photo-b.jpg' },
        { uri: 'file:///photo-c.jpg' },
      ],
    });
    (UploadService.uploadImage as jest.Mock)
      .mockResolvedValueOnce(res('https://cdn.example.com/a.jpg'))
      .mockResolvedValueOnce(res('https://cdn.example.com/b.jpg'))
      .mockResolvedValueOnce(res('https://cdn.example.com/c.jpg'));
    (PropertyService.addImage as jest.Mock)
      .mockResolvedValueOnce(res({ id: 1, imageUrl: 'https://cdn.example.com/a.jpg', isPrimary: true }))
      .mockResolvedValueOnce(res({ id: 2, imageUrl: 'https://cdn.example.com/b.jpg', isPrimary: false }))
      .mockResolvedValueOnce(res({ id: 3, imageUrl: 'https://cdn.example.com/c.jpg', isPrimary: false }));

    const screen = render(<PropertyImagesScreen navigation={nav} route={route} />);
    await waitFor(() => expect(screen.getByText('Add Photo')).toBeTruthy());

    await act(async () => { fireEvent.press(screen.getByText('Add Photo')); });

    await waitFor(() => {
      expect(UploadService.uploadImage).toHaveBeenCalledTimes(3);
    });

    expect(UploadService.uploadImage).toHaveBeenNthCalledWith(1, 'file:///photo-a.jpg');
    expect(UploadService.uploadImage).toHaveBeenNthCalledWith(2, 'file:///photo-b.jpg');
    expect(UploadService.uploadImage).toHaveBeenNthCalledWith(3, 'file:///photo-c.jpg');

    expect(PropertyService.addImage).toHaveBeenCalledTimes(3);

    expect(PropertyService.addImage).toHaveBeenNthCalledWith(1, PROPERTY_ID, 'https://cdn.example.com/a.jpg', true);
    expect(PropertyService.addImage).toHaveBeenNthCalledWith(2, PROPERTY_ID, 'https://cdn.example.com/b.jpg', false);

    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.property(PROPERTY_ID),
    });
  });

  it('still uploads remaining assets and shows failure count when one upload fails', async () => {
    const picker = require('expo-image-picker');
    (picker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///ok.jpg' }, { uri: 'file:///bad.jpg' }],
    });
    (UploadService.uploadImage as jest.Mock)
      .mockResolvedValueOnce(res('https://cdn.example.com/ok.jpg'))
      .mockRejectedValueOnce(new Error('Network error'));
    (PropertyService.addImage as jest.Mock).mockResolvedValueOnce(
      res({ id: 5, imageUrl: 'https://cdn.example.com/ok.jpg', isPrimary: true })
    );

    const { Alert } = require('react-native');
    jest.spyOn(Alert, 'alert');

    const screen = render(<PropertyImagesScreen navigation={nav} route={route} />);
    await waitFor(() => expect(screen.getByText('Add Photo')).toBeTruthy());

    await act(async () => { fireEvent.press(screen.getByText('Add Photo')); });

    await waitFor(() => {

      expect(PropertyService.addImage).toHaveBeenCalledTimes(1);

      expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Some Uploads Failed',
      expect.stringContaining('1 of 2')
    );
  });
});
