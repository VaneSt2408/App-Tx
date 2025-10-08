import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://wjgnktfkbdvofzdotkdn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZ25rdGZrYmR2b2Z6ZG90a2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTEwODYsImV4cCI6MjA3NDU4NzA4Nn0.y4zqWisgouwsnkIN7-tRQ_8R7sWA0tdlz-6LeFWcQ78';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  { 
    auth: {
      storage: AsyncStorage, 
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, 
    },
  } 
);