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

// --- Inicio de sesión con Google (OAuth) ---

// Esta línea ayuda a cerrar la sesión de autenticación del navegador si la app se cerró inesperadamente. Es importante para iOS.
WebBrowser.maybeCompleteAuthSession(); 

// Define la función asíncrona principal para el flujo de inicio de sesión con Google.
export const signInWithGoogle = async () => {
  // Inicia un bloque try...catch para manejar cualquier error que pueda ocurrir durante el proceso.
  try {
    console.log("🚀 --- INICIO DE LOGIN CON GOOGLE ---"); // Log para depuración.

    // Crea la URL a la que Google debe redirigir al usuario después de la autenticación.
    const redirectTo = makeRedirectUri({ useProxy: true }); // 'useProxy: true' es clave para que funcione en Expo Go.
    console.log("🧭 Redirect URI generada con makeRedirectUri:", redirectTo); // Log para depuración.

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

    console.log("📡 Respuesta de Supabase (signInWithOAuth):", data); // Log para depuración.

    // Si Supabase devuelve un error al intentar iniciar el flujo, lo manejamos.
    if (error) {
      console.error("❌ Error al iniciar OAuth con Supabase:", error); // Muestra el error en consola.
      throw new Error(error.message); // Lanza una excepción para que sea atrapada por el bloque 'catch'.
    }

    // Si Supabase devuelve una URL de autenticación, procedemos a abrirla.
    if (data?.url) {
      console.log("🔗 URL de autenticación de Google (Supabase):", data.url); // Log para depuración.

      // Abre la URL de Google en un navegador dentro de la aplicación.
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      console.log("📦 Resultado WebBrowser (completo):", result); // Log para depuración.
      
      // Si el usuario completa el flujo exitosamente en el navegador ('success').
      if (result.type === "success" && result.url) {
        console.log("🔙 URL final devuelta por Google:", result.url); // Log para depuración.

        // La URL de retorno contiene los tokens en el "fragmento" (después del '#').
        const fragment = result.url.split("#")[1]; // Extraemos esa parte de la URL.
        // Usamos URLSearchParams para parsear fácilmente los parámetros del fragmento.
        const queryParams = new URLSearchParams(fragment);

        // Obtenemos el access_token y el refresh_token de los parámetros.
        const access_token = queryParams.get("access_token");
        const refresh_token = queryParams.get("refresh_token");
        
        // Verificamos que los tokens se hayan extraído correctamente.
        console.log("🔑 Access Token extraído:", access_token);
        console.log("🔄 Refresh Token extraído:", refresh_token);

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
          console.error("❌ Error al establecer sesión en Supabase:", setSessionError);
          Alert.alert("Error", "No se pudo establecer la sesión.");
        } else { // Si la sesión se estableció correctamente.
          console.log("🎉 Sesión de Supabase establecida correctamente:", sessionData);
          Alert.alert("Éxito", "Inicio de sesión con Google completado.");
        }
      } else { // Si el usuario cancela el flujo en el navegador ('cancel', 'dismiss', etc.).
        console.warn("⚠️ Flujo cancelado o no exitoso:", result.type);
      }
    } else { // Si por alguna razón Supabase no devolvió una URL.
      console.warn("⚠️ No se recibió data.url de Supabase");
    }
  } catch (e) { // Captura cualquier error general que haya ocurrido en el bloque 'try'.
    console.error("❌ Error general en el flujo OAuth:", e);
    Alert.alert("Error", "Ocurrió un error con Google: " + e.message);
  } finally { // Este bloque se ejecuta siempre, al final del proceso.
    console.log("🏁 --- FIN DEL FLUJO DE LOGIN CON GOOGLE ---"); // Log para depuración.
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