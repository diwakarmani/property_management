

const RENDER_URL = 'https://champions-3qkd.onrender.com';
const LOCAL_URL = 'http://localhost:8080';

const inlinedUrl = process.env.EXPO_PUBLIC_API_URL;
const inlinedTimeout = process.env.EXPO_PUBLIC_API_TIMEOUT;

export const ENV = {
  API_URL:
    inlinedUrl && inlinedUrl.trim().length > 0
      ? inlinedUrl
      : __DEV__
      ? LOCAL_URL
      : RENDER_URL,
  API_TIMEOUT: inlinedTimeout ? Number(inlinedTimeout) || 60000 : 60000,
  IS_DEV: __DEV__,
};
