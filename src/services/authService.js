// En: src/services/authService.js
import { supabase } from '../supabase/client';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';

//Iniciar sesión con correo y contraseña
export const signInWithPassword = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
};

//Iniciar sesión con Google
export const signInWithGoogle = async () => {
  try {
    const redirectTo = makeRedirectUri({ native: 'mitaskapp://' });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    });

    if (error) throw new Error(error.message);

    if (data?.url) {
      await WebBrowser.openAuthSessionAsync(data.url);
    }
  } catch (e) {
    Alert.alert('Error', 'Ocurrió un error inesperado con Google: ' + e.message);
  }
};


//Cerrar sesión
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};


// Obtener la sesión actual
export const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
}

export const onAuthStateChange = (callback) => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
    return authListener;
}