import axios from 'axios';
import { ENV } from '@/config/env';
import { getAccessToken, saveTokens, clearTokens } from '@/utils/helpers/storage';
import { toast } from '@/utils/toast';

const axiosClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: ENV.API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
axiosClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();

    const isAuthRoute = config.url?.startsWith('/api/auth/');

    if (token && !isAuthRoute) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    if (!response) {
      toast.error('No internet connection. Please check your network.');
      return Promise.reject(error);
    }

    const message = response.data?.message || 'Something went wrong';

    const originalRequest = error.config;

    const isAuthRoute = originalRequest?.url?.startsWith('/api/auth/');

    // Don't attempt refresh for auth APIs
    if (isAuthRoute) {
      return Promise.reject(error);
    }

    // Handle token expiry for protected APIs
    if (error.response?.status === 401 && !originalRequest._retry) {

      originalRequest._retry = true;

      try {

        const { getRefreshToken } = await import('@/utils/helpers/storage');
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const refreshResponse = await axios.post(
          `${ENV.API_URL}/api/auth/refresh-token`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } =
          refreshResponse.data.data;

        await saveTokens(accessToken, newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return axiosClient(originalRequest);

      } catch (refreshError) {

        await clearTokens();

        // Redux / navigation will redirect to login
        return Promise.reject(refreshError);
      }
    }

    switch (response.status) {
      case 400:
        toast.error(message);
        break;
      case 403:
        toast.error('You do not have permission to perform this action');
        break;
      case 404:
        toast.error('Resource not found');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;