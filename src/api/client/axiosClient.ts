import axios from 'axios';
import { ENV } from '@/config/env';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '@/utils/helpers/storage';
import { toast } from '@/utils/toast';
import { requestTracker } from '@/utils/requestTracker';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipGlobalLoader?: boolean;
    skipSuccessToast?: boolean;
    skipErrorToast?: boolean;
  }

  interface InternalAxiosRequestConfig {
    skipGlobalLoader?: boolean;
    skipSuccessToast?: boolean;
    skipErrorToast?: boolean;
  }
}

const MUTATING = new Set(['post', 'put', 'patch', 'delete']);

const axiosClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

const MAX_RETRIES = 1;
const RETRY_BASE_DELAY = 800;

const isIdempotent = (config: any): boolean => {
  const m = (config?.method || 'get').toLowerCase();
  return m === 'get' || m === 'head' || m === 'options';
};

const isMutating = (config: any): boolean =>
  MUTATING.has((config?.method || 'get').toLowerCase());

axiosClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token && !config.url?.startsWith('/api/auth/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (isMutating(config) && !config.skipGlobalLoader) {
      requestTracker.show();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => {
    const config = response.config as any;
    const mutating = isMutating(config);

    if (mutating && !config.skipGlobalLoader) {
      requestTracker.hide();
    }

    if (mutating && !config.skipSuccessToast) {
      const msg = response.data?.message;
      if (msg) toast.success(msg);
    }

    return response;
  },

  async (error) => {
    const { response } = error;
    const originalRequest = error.config || {};
    const isAuthRoute = originalRequest?.url?.startsWith('/api/auth/');
    const mutating = isMutating(originalRequest);

    if (mutating && !originalRequest.skipGlobalLoader) {
      requestTracker.hide();
    }

    if (response?.status === 401 && !isAuthRoute && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');
        const r = await axios.post(`${ENV.API_URL}/api/auth/refresh-token`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = r.data.data;
        await saveTokens(accessToken, newRefresh);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosClient(originalRequest);
      } catch {
        await clearTokens();
        return Promise.reject(error);
      }
    }

    const isTransient = !response || response.status >= 500;
    if (isTransient && isIdempotent(originalRequest) && !isAuthRoute) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      if (originalRequest._retryCount <= MAX_RETRIES) {
        const delay = RETRY_BASE_DELAY * 2 ** (originalRequest._retryCount - 1);
        await new Promise((res) => setTimeout(res, delay));
        return axiosClient(originalRequest);
      }
    }

    if (originalRequest.skipErrorToast) {
      return Promise.reject(error);
    }

    if (!response) {

      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
      toast.error(
        isTimeout
          ? 'Request timed out. Please check your connection.'
          : 'No internet connection. Please check your network.'
      );
      return Promise.reject(error);
    }

    if (isAuthRoute) {
      return Promise.reject(error);
    }

    const msg = response.data?.message || 'Something went wrong';
    switch (response.status) {
      case 400: toast.error(msg); break;
      case 403: toast.error('You do not have permission to perform this action.'); break;
      case 404: toast.error('The requested resource was not found.'); break;
      case 422: toast.error(msg); break;
      case 500:
      case 502:
      case 503: toast.error('Server error. Please try again later.'); break;
      default:  toast.error(msg);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
