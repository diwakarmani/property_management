import axiosClient from '../client/axiosClient';
import type { ApiResponse } from '../types/auth.types';

export const UploadService = {

  uploadImage: (localUri: string): Promise<import('axios').AxiosResponse<ApiResponse<string>>> => {
    const filename = localUri.split('/').pop() ?? 'photo.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';

    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      name: filename,
      type: mimeType,
    } as any);

    return axiosClient.post<ApiResponse<string>>('/api/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
