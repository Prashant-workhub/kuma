/**
 * Centralized API configuration.
 * Uses an explicitly configured API origin.  When no origin is configured in
 * production, requests use same-origin /api routes so the React app can still
 * render while a backend URL is being configured.
 */

import { Capacitor } from '@capacitor/core';

const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || '';
  }
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && metaEnv[key]) {
      return metaEnv[key];
    }
  } catch {
    // ignore
  }
  return '';
};

const isProd = getEnv('PROD') === 'true' || (typeof process !== 'undefined' && process.env.NODE_ENV === 'production');
const apiEnvUrl = getEnv('VITE_API_URL') || getEnv('VITE_BACKEND_URL');

if (isProd && !apiEnvUrl) {
  console.warn("VITE_API_URL is not configured; API requests will use this deployment's /api routes.");
}

let defaultApiUrl = 'http://localhost:3003';
if (Capacitor.isNativePlatform()) {
  const platform = Capacitor.getPlatform();
  if (platform === 'android') {
    // Android emulator can reach host machine via 10.0.2.2; real devices need the LAN IP
    defaultApiUrl = 'http://10.0.2.2:3003';
  } else {
    // iOS simulator can reach host via localhost; real iOS devices need LAN IP
    defaultApiUrl = 'http://localhost:3003';
  }
}

export const API_BASE_URL = apiEnvUrl?.replace(/\/$/, '') ?? (Capacitor.isNativePlatform() ? defaultApiUrl : (isProd ? '' : defaultApiUrl));

/**
 * Returns true when the device appears to have network connectivity.
 * Checks both navigator.onLine and attempts a lightweight connectivity probe
 * (since mobile WebViews can report "online" while actually being stuck on a captive portal).
 */
export async function isNetworkAvailable(): Promise<boolean> {
  if (typeof navigator === 'undefined') return true;
  if (!navigator.onLine) return false;
  // Quick probe: try to reach a known public endpoint with a short timeout
  // Using generic successful HTTP response check instead of specific API endpoint
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    // Use a simple reliable endpoint (dns.google supports HTTPS and is very stable)
    const res = await fetch('https://dns.google/resolve?name=example.com&type=A', {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timer);
    return res.ok; // Any successful response means internet is reachable
  } catch {
    return true; // fetch probe failed but navigator says online — trust navigator
  }
}
