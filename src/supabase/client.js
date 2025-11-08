import { createClient } from '@supabase/supabase-js'; // Importa la función para crear el cliente de SupaBase
import 'react-native-url-polyfill/auto'; // Importa el polyfill para URL en React Native
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importa AsyncStorage para el almacenamiento local en React Native

const SUPABASE_URL = 'https://wjgnktfkbdvofzdotkdn.supabase.co'; // URL del proyecto en SupaBase
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZ25rdGZrYmR2b2Z6ZG90a2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTEwODYsImV4cCI6MjA3NDU4NzA4Nn0.y4zqWisgouwsnkIN7-tRQ_8R7sWA0tdlz-6LeFWcQ78'; // Clave pública anónima del proyecto en SupaBase

//const SUPABASE_URL = 'https://imjzqyfcvftpulmvtsep.supabase.co'; // Reemplaza con tu URL de SupaBase
//const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltanpxeWZjdmZ0cHVsbXZ0c2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDkyMjcsImV4cCI6MjA3Njk4NTIyN30.5G06Z3t5mTZFkaOBsZjrx_ZupJqp3STaDQXZzXOkhmE';
// Crea el cliente de SupaBase con la URL, la clave y las opciones de autenticación
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  { 
    auth: {
      storage: AsyncStorage, // Usa AsyncStorage para almacenar la sesión
      autoRefreshToken: true, // Habilita la actualización automática del token
      persistSession: true, // Habilita la persistencia de la sesión
      detectSessionInUrl: false, // Deshabilita la detección de la sesión en la URL (No es necesaria en React Native)
    },
  } 
);