// En: src/services/authService.js
import { supabase } from '../supabase/client'; // Importa la instancia del cliente de Supabase para interactuar con sus servicios.
import * as WebBrowser from 'expo-web-browser'; // Importa la librería de Expo para abrir un navegador web dentro de la app.
import { Alert } from 'react-native'; // Importa el componente Alert para mostrar diálogos nativos.
import { makeRedirectUri } from 'expo-auth-session'; // Importa una función de Expo para crear URIs de redirección dinámicas.
import * as Linking from "expo-linking"; // Importa la librería de Expo para manejar deep links.

// --- Iniciar sesión con correo y contraseña ---
// Define una función asíncrona para manejar el inicio de sesión tradicional.
export const signInWithPassword = async (email, password) => { 
  // Llama al método 'signInWithPassword' de Supabase Auth, pasándole el email y la contraseña.
  const { data, error } = await supabase.auth.signInWithPassword({ email, password }); 
  // Devuelve el objeto con los datos de la sesión y el posible error.
  return { data, error }; 
};

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

// --- Registro de nuevos usuarios (Clientes) ---
// Esta función crea la cuenta en Supabase Auth.
export const signUpWithEmail = async (email, password) => {
    // Genera la URI de redirección apropiada para el correo de confirmación
    const redirectUri = getRedirectUri();
    
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            emailRedirectTo: redirectUri, // URL donde el usuario será redirigido después de confirmar el email
        }
    });
    return { data, error };
};

// --- Creación del perfil en la tabla 'clientes' ---
// Ahora acepta y guarda la URL del avatar en la tabla 'clientes'.
// El teléfono se guarda en la tabla 'perfiles' para consistencia.
export const createClientProfile = async (userId, fullName, phone, avatarUrl) => {
    // Insertar perfil en tabla clientes (sin teléfono)
    const { data, error } = await supabase
        .from('clientes')
        .insert({
            id: userId,
            nombre_completo: fullName,
            avatar_url: avatarUrl // <-- Aquí guardamos la URL de la foto
        });
    if (error) {
        return { data, error };
    }

    // Actualizar o insertar teléfono en tabla perfiles
    if (phone) {
        const { error: perfilesError } = await supabase
            .from('perfiles')
            .upsert({
                id: userId,
                telefono: phone
            }, {
                onConflict: 'id'
            });
        if (perfilesError) {
            // No retornamos error aquí para no fallar la creación del perfil principal
        }
    }

    return { data, error };
};

// --- Función para verificar el rol y perfil del usuario ---
export const checkUserRole = async (userId) => {
    if (!userId) return null;

    try {
        // Paso 1: Buscamos el perfil en la tabla 'clientes'.
        const { data: clientData, error: clientError } = await supabase
            .from('clientes')
            .select('id, nombre_completo, avatar_url')
            .eq('id', userId)
            .single();

        // Si hay un error que no sea "no se encontró la fila", lo registramos.
        if (clientError && clientError.code !== 'PGRST116') {
            return null; // Devolvemos null para evitar que la app se rompa.
        }

        // Paso 2: Buscamos el perfil en la tabla 'perfiles' para obtener el rol.
        const { data: profileData, error: profileError } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
        }

        // Paso 3: Combinamos la información.
        // Si encontramos un perfil de cliente, usamos esa información.
        if (clientData) {
            return {
                ...clientData, // Incluye id, nombre_completo, avatar_url
                rol: profileData?.rol || 'cliente' // Añade el rol desde 'perfiles'
            };
        }

        // Si no es un cliente, devolvemos lo que encontramos en 'perfiles' (para admin/artesano).
        return profileData;

    } catch (error) {
        return null;
    }
};

// --- Inicio de sesión con Google (OAuth) ---
// Esta línea ayuda a cerrar la sesión de autenticación del navegador si la app se cerró inesperadamente. Es importante para iOS.
WebBrowser.maybeCompleteAuthSession(); 

// Define la función asíncrona principal para el flujo de inicio de sesión con Google.
export const signInWithGoogle = async () => {
  // Inicia un bloque try...catch para manejar cualquier error que pueda ocurrir durante el proceso.
  try {

    // Crea la URL a la que Google debe redirigir al usuario después de la autenticación.
    const redirectTo = getRedirectUri(); // Usa la función utilitaria

    // Llama a Supabase para iniciar el flujo OAuth con el proveedor 'google'.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google", // Especifica que el proveedor de OAuth es Google.
      options: {
        redirectTo, // Pasa la URL de redirección que creamos antes.
        queryParams: { // Parámetros adicionales para la solicitud a Google.
          access_type: "offline", // Solicita un refresh_token para mantener la sesión activa.
          prompt: "consent", // Pide al usuario que dé su consentimiento cada vez.
        },
      },
    });


    // Si Supabase devuelve un error al intentar iniciar el flujo, lo manejamos.
    if (error) {
      throw new Error(error.message); // Lanza una excepción para que sea atrapada por el bloque 'catch'.
    }

    // Si Supabase devuelve una URL de autenticación, procedemos a abrirla.
    if (data?.url) {

      // Abre la URL de Google en un navegador dentro de la aplicación.
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      
      // Si el usuario completa el flujo exitosamente en el navegador ('success').
      if (result.type === "success" && result.url) {


        // La URL de retorno contiene los tokens en el "fragmento" (después del '#').
        const fragment = result.url.split("#")[1]; // Extraemos esa parte de la URL.
        // Usamos URLSearchParams para parsear fácilmente los parámetros del fragmento.
        const queryParams = new URLSearchParams(fragment);

        // Obtenemos el access_token y el refresh_token de los parámetros.
        const access_token = queryParams.get("access_token");
        const refresh_token = queryParams.get("refresh_token");
        
        // Verificamos que los tokens se hayan extraído correctamente.

        // Si no se obtuvieron los tokens, algo salió mal.
        if (!access_token || !refresh_token) {
            Alert.alert("Error", "No se pudieron obtener los tokens de autenticación.");
            return; // Detenemos la ejecución.
        }

        // Usamos los tokens obtenidos para establecer manualmente la sesión del usuario en Supabase.
        const { data: sessionData, error: setSessionError } =
          await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

        // Si hay un error al establecer la sesión, se lo notificamos al usuario.
        if (setSessionError) {
          Alert.alert("Error", "No se pudo establecer la sesión.");
        } else { // Si la sesión se estableció correctamente.
        }
      } else { // Si el usuario cancela el flujo en el navegador ('cancel', 'dismiss', etc.).
      }
    } else { // Si por alguna razón Supabase no devolvió una URL.
    }
  } catch (e) { // Captura cualquier error general que haya ocurrido en el bloque 'try'.
    Alert.alert("Error", "Ocurrió un error con Google: " + e.message);
  } finally { // Este bloque se ejecuta siempre, al final del proceso.
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


/**
 * Solicita a Supabase un correo de recuperación de contraseña para el email dado.
 * Esta función funciona tanto en desarrollo como en producción.
 * @param {string} email El correo electrónico del usuario.
 * @returns {Promise<{error: string | null}>} Un objeto con error (si lo hay) o null si es exitoso.
 */
export const resetPasswordForEmail = async (email) => {
    try {
        const redirectUri = getRedirectUri("resetPassword"); // Usa la función utilitaria con ruta específica
        
        // Usamos la sintaxis correcta para resetPasswordForEmail
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            emailRedirectTo: redirectUri,
        });

        if (error) {
            return { error: error.message };
        }
        
        return { error: null };
        
    } catch (e) {
        return { error: e.message || "Ocurrió un error del sistema inesperado." };
    }
}

/**
 * Actualiza la contraseña del usuario actualmente autenticado.
 * Esta función es llamada desde la pantalla /resetPassword.
 * @param {string} newPassword La nueva contraseña a establecer.
 * @returns {Promise<{error: string | null}>} Un objeto con error (si lo hay) o null si es exitoso.
 */
export const updatePassword = async (newPassword) => {
    try {
        // Añadimos una validación para no enviar una contraseña vacía
        if (!newPassword || newPassword.trim() === '') {
            return { error: 'La nueva contraseña no puede estar vacía.' };
        }

        // Llama a Supabase para actualizar la contraseña.
        // Supabase usa la sesión temporal activa (creada por el enlace de recuperación) 
        // para identificar al usuario que está solicitando el cambio.
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) {
            return { error: error.message };
        }

        return { error: null };
    } catch (e) {
        return { error: e.message || "Ocurrió un error al actualizar la contraseña." };
    }
}