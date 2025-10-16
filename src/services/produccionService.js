//Solo se usarán en producción...

import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../supabase/client'; // Asegúrate que la ruta sea correcta

// --- URL de Redirección para Producción ---
// Esta es la URL que registraste en Supabase y Google Cloud.
const redirectTo = 'mitaskapp://auth/callback';

/**
 * 🚀 Inicia el flujo de autenticación con Google para producción.
 * Abre el navegador para que el usuario inicie sesión. La lógica en App.js
 * se encargará de recibir la redirección y establecer la sesión.
 */
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error('No se recibió la URL de OAuth de Supabase');

    // Abre el navegador y espera que el usuario complete el flujo.
    await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  } catch (e) {
    Alert.alert('Error de Autenticación', 'No se pudo iniciar sesión con Google: ' + e.message);
  }
};


/**
 * 📧 Envía un enlace de invitación (Magic Link) a un artesano.
 * El correo incluirá un enlace que, al ser presionado, redirigirá
 * al usuario de vuelta a la app con el rol 'En proceso'.
 */
export const sendArtesanoInvite = async (email) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Asigna metadatos que puedes usar en tus Triggers o Policies de Supabase
      data: { role: 'En proceso' },
      // Le dice a Supabase a dónde redirigir después de que el usuario haga clic en el enlace
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    if (error.message.includes('User already registered')) {
      throw new Error('Este correo ya está registrado en el sistema.');
    }
    throw new Error(`Error al enviar el enlace: ${error.message}`);
  }

  return data;
};