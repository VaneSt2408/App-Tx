import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
// 1. Cambia la importación:
import * as SecureStore from 'expo-secure-store';
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;


const ExpoSecureStoreAdapter = {
  getItem: (key) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key, value) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key) => {
    SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  { 
    auth: {
      // 3. Usa el adaptador en lugar de AsyncStorage
      storage: ExpoSecureStoreAdapter, 
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  } 
);