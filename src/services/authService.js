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
export const signInWithGoogle = async () => { // No recibe parámetros
  try {
    const redirectTo = makeRedirectUri({ native: 'mitaskapp://' }); // Crea la URI de redirección para la aplicación nativa

    const { data, error } = await supabase.auth.signInWithOAuth({ // Llama al método de SupaBase para iniciar sesión con OAuth
      provider: 'google', // Especifica Google como proveedor
      options: { // Opciones adicionales
        redirectTo, // Usa la URI de redirección creada
        queryParams: { // Parámetros de consulta adicionales
          access_type: 'offline', // Solicita acceso offline para obtener un refresh token
          prompt: 'consent', // Solicita el consentimiento del usuario en cada inicio de sesión
        },
      }
    });

    if (error) throw new Error(error.message); // Si hay un error, lanza una excepción
    // Abre la sesión de autenticación en el navegador
    // En React Native, esto abrirá el navegador del dispositivo
    // Asegúrate de que la URL de redirección esté configurada correctamente en la consola de Google y en SupaBase
    // La redirección de vuelta a la app se maneja automáticamente por Expo

    if (data?.url) { // Si hay una URL en los datos, abre la sesión de autenticación
      await WebBrowser.openAuthSessionAsync(data.url); // Abre la URL en el navegador
    }
  } catch (e) {
    Alert.alert('Error', 'Ocurrió un error inesperado con Google: ' + e.message); // Muestra una alerta si ocurre un error
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