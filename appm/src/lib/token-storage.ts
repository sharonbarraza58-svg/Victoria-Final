import { Platform } from 'react-native';

/**
 * expo-secure-store no está pensado para correr en navegador web (ahí no
 * hay keychain/keystore del sistema operativo). En web usamos localStorage
 * directamente; en iOS/Android sí usamos SecureStore, que es lo seguro.
 */
const TOKEN_KEY = 'victoria_token';

async function getSecureStore() {
  return import('expo-secure-store');
}

export async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
  }
  const SecureStore = await getSecureStore();
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  const SecureStore = await getSecureStore();
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(TOKEN_KEY);
    return;
  }
  const SecureStore = await getSecureStore();
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
