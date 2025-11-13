// En: src/supabase/client.js

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native'; // <-- 1. Importa Platform

// Asegúrate de que tus variables de entorno estén aquí
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// 2. Comprueba en qué plataforma estamos
// Si no es 'ios' o 'android', será 'web' o 'server'
const storage = Platform.OS === 'ios' || Platform.OS === 'android'
  ? AsyncStorage  // Usa AsyncStorage en nativo
  : undefined;      // Deja que Supabase use el default (localStorage) en web/server

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage, // <-- 3. Usa la variable de storage condicional
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Muy importante para React Native
  },
});