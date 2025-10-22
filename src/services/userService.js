//Backend / En: src/services/userService.js
import { supabase } from '../supabase/client'; // Importa la instancia del cliente de Supabase.
import { Alert } from 'react-native'; // Importa el componente Alert de React Native.
import { makeRedirectUri } from 'expo-auth-session'; // Importa la función de Expo para crear URIs de redirección.

// --- Función utilitaria para generar URIs de redirección ---
/**
 * Genera la URI de redirección apropiada según el entorno
 * En desarrollo usa el proxy de Expo, en producción usa el scheme personalizado
 * @param {string} path - Ruta específica (opcional)
 * @returns {string} URI de redirección
 */
const getRedirectUri = (path = null) => {
    // Verificamos si estamos en desarrollo (Expo Go) o en producción
    const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
        // En desarrollo, usar el formato exp:// que funciona con tunnel
        // Forzamos el uso del formato exp:// en lugar de https://auth.expo.io
        return makeRedirectUri({
            path: path || '', // No agregar --/ aquí, makeRedirectUri lo maneja automáticamente
            useProxy: false, // Importante: false para usar formato exp://
        });
    } else {
        // En producción, usar el scheme personalizado de la app
        return makeRedirectUri({
            path: path || '',
            scheme: 'txapp', // Scheme configurado en app.json
        });
    }
};

// --- Función para enviar la invitación al artesano (enlace mágico) ---
export const sendArtesanoInvite = async (email) => { 
  try {
    console.log("🚀 --- ENVIANDO INVITACIÓN A ARTESANO ---");
    
    // Usa la función utilitaria para generar la URI de redirección apropiada
    const redirectUri = getRedirectUri();
    console.log(`🔗 Redirect URI generada: ${redirectUri}`);
    console.log(`📱 Entorno: ${__DEV__ ? 'Desarrollo' : 'Producción'}`);
    
    // Llama al método de Supabase para iniciar sesión con un enlace de un solo uso (OTP/Magic Link).
    const { data, error } = await supabase.auth.signInWithOtp({
      email, // El correo electrónico al que se enviará el enlace.
      options: {
        // 'data' permite pasar metadatos que se asocian al usuario al momento del registro.
        data: { role: 'En proceso' }, // Se asigna un rol temporal al usuario invitado.
        // 'emailRedirectTo' es la URL a la que el usuario será redirigido después de hacer clic en el enlace.
        emailRedirectTo: redirectUri, // Usa la función utilitaria
      },
    });

    // Si Supabase devuelve un error durante el envío del enlace...
    if (error) {
      console.error("❌ Error al enviar invitación:", error);
      // ...se comprueba si el error es porque el usuario ya existe.
      if (error.message.includes("User already registered")) {
        // Si es así, se lanza un error personalizado y más claro para el usuario.
        throw new Error("Este correo ya está registrado en el sistema.");
      }
      // Para cualquier otro tipo de error, se lanza un error genérico.
      throw new Error(`Error al enviar el enlace: ${error.message}`);
    }

    console.log("✅ Invitación enviada exitosamente");
    // Si no hay errores, se devuelve la información de la operación.
    return data;
  } catch (e) {
    console.error("❌ Error en sendArtesanoInvite:", e);
    throw e; // Re-lanza el error para que sea manejado por el componente que llama
  }
};

// --- Función para completar el registro del artesano una vez que ha iniciado sesión ---
export const completeArtesanoRegistration = async (registrationData) => {
  // Imprime un mensaje en consola para indicar que la función ha comenzado.
  console.log("[userService] --- Iniciando completeArtesanoRegistration ---");

  // Desestructura los datos del formulario de registro que se reciben como parámetro.
  const { nombre, telefono, ubicacion, categoria, curp, numero_ine, folio } = registrationData;

  // Inicia un bloque 'try...catch' para manejar errores durante el proceso.
  try {
    // Obtiene la sesión del usuario actual que ya debe estar autenticado (al hacer clic en el enlace mágico).
    const { data: { user } } = await supabase.auth.getUser();
    // Si no se encuentra un usuario, significa que no hay una sesión activa, por lo que se lanza un error.
    if (!user) throw new Error("No hay sesión activa. El usuario debe autenticarse primero.");

    // 1. Actualiza la tabla 'perfiles' para el usuario actual.
    const { error: profileError } = await supabase
      .from('perfiles') // Especifica la tabla 'perfiles'.
      .update({ rol: 'artesano', telefono }) // Actualiza el 'rol' a 'artesano' y el 'telefono'.
      .eq('id', user.id); // Asegura que solo se actualice el perfil cuyo 'id' coincida con el del usuario actual.
    // Si ocurre un error durante la actualización del perfil, se lanza para ser capturado por el bloque 'catch'.
    if (profileError) throw profileError;

    // 2. Inserta un nuevo registro en la tabla 'artesanos'.
    const { data: artesanoData, error: artesanoError } = await supabase
      .from('artesanos') // Especifica la tabla 'artesanos'.
      .insert({ // Define los datos del nuevo registro.
        user_id: user.id, // Vincula este registro de artesano con el ID del usuario en la tabla 'auth.users'.
        nombre,
        ubicacion,
        categoria,
        curp,
        numero_ine,
        folio,
      })
      .select(); // '.select()' hace que la operación devuelva el registro recién insertado.
    // Si ocurre un error durante la inserción, se lanza para ser capturado por el bloque 'catch'.
    if (artesanoError) throw artesanoError;

    // Imprime un mensaje de éxito en la consola.
    console.log("[userService] ✅ Datos de artesano insertados con éxito.");

    // Devuelve un objeto indicando que la operación fue exitosa y los datos del nuevo artesano.
    return { success: true, artesanoData };
  } catch (error) { // Si se lanza cualquier error en el bloque 'try', se captura aquí.
    // Imprime el error completo en la consola para depuración.
    console.error("[userService] ❌ ERROR GENERAL ATRAPADO:", error);
    // Devuelve un objeto indicando que la operación falló y el mensaje de error.
    return { success: false, error: error.message || error };
  }
};