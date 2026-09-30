   import Constants from 'expo-constants';
   import { Platform } from 'react-native';

   const host = Constants.expoConfig?.hostUri?.split(':')[0]; // ej: 192.168.1.25

   export const API_BASE_URL =
     Platform.OS === 'web' || !host ? 'http://localhost:8000' : `http://${host}:8000`;