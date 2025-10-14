// En: src/services/authService.js
import { supabase } from '../supabase/client'; // Importa el cliente de SupaBase
import * as WebBrowser from 'expo-web-browser'; // Importa WebBrowser para manejar la autenticación OAuth en React Native
import { Alert } from 'react-native'; // Importa Alert para mostrar mensajes de alerta en React Native
import { makeRedirectUri } from 'expo-auth-session'; // Importa makeRedirectUri para crear URIs de redirección

//Iniciar sesión con correo y contraseña
export const signInWithPassword = async (email, password) => { // Recibe email y password como parámetros
  const { data, error } = await supabase.auth.signInWithPassword({ email, password }); // Llama al método de SupaBase para iniciar sesión con correo y contraseña
  return { data, error }; // Retorna los datos y el error (si existe)
};

//Iniciar sesión con Google
export const signInWithGoogle = async () => {
  try {
    const redirectTo = makeRedirectUri(); // No necesita 'native' para Expo Go

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
    Alert.alert('Error', 'Ocurrió un error con Google: ' + e.message);
  }
};

//Cerrar sesión
export const signOut = async () => { // No recibe parámetros
  const { error } = await supabase.auth.signOut(); // Llama al método de SupaBase para cerrar sesión
  return { error }; // Retorna el error (si existe)
};


// Obtener la sesión actual
export const getSession = async () => { // No recibe parámetros
    const { data, error } = await supabase.auth.getSession(); // Llama al método de SupaBase para obtener la sesión actual
    return { session: data.session, error }; // Retorna la sesión y el error (si existe)
}

export const onAuthStateChange = (callback) => { // Recibe una función de callback como parámetro
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => { // Escucha los cambios en el estado de autenticación
        callback(event, session); // Llama al callback con el evento y la sesión actual
    });
    return authListener; // Retorna el listener para poder desuscribirse si es necesario
}