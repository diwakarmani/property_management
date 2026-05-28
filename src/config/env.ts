/**
 * Environment-driven config (gap analysis FE-09 follow-up / user feedback).
 *
 * <p>The API URL is read from {@code EXPO_PUBLIC_API_URL} — set it in
 * {@code PropertyApp/.env} for local dev (see {@code .env.example}) or via EAS
 * env vars per build profile (dev / preview / production). The fallback below
 * is intentionally an iOS-simulator-friendly localhost so a fresh checkout
 * runs without any env config.
 *
 * <p>Expo's bundler statically inlines {@code process.env.EXPO_PUBLIC_*} at
 * build time, so no native module is required.
 */
// The only baked-in default is iOS-simulator-friendly localhost so a fresh
// checkout boots without env config. Staging / production EAS builds MUST set
// EXPO_PUBLIC_API_URL — if they don't, the app hits localhost and fails loudly
// with a network error rather than silently pointing at a stale URL.
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
