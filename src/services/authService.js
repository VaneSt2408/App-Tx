// En: src/services/authService.js
import { supabase } from '../supabase/client'; // Importa el cliente de SupaBase
import * as WebBrowser from 'expo-web-browser'; // Importa WebBrowser para manejar la autenticación OAuth en React Native
import { Alert } from 'react-native'; // Importa Alert para mostrar mensajes de alerta en React Native
import { makeRedirectUri } from 'expo-auth-session'; // Importa makeRedirectUri para crear URIs de redirección
import * as Linking from "expo-linking";

//Iniciar sesión con correo y contraseña
export const signInWithPassword = async (email, password) => { // Recibe email y password como parámetros
  const { data, error } = await supabase.auth.signInWithPassword({ email, password }); // Llama al método de SupaBase para iniciar sesión con correo y contraseña
  return { data, error }; // Retorna los datos y el error (si existe)
};

WebBrowser.maybeCompleteAuthSession();

export const signInWithGoogle = async () => {
  try {
    console.log("🚀 --- INICIO DE LOGIN CON GOOGLE ---");

    // ✅ Usa el proxy de Expo (funciona en físico y túnel)
    const redirectTo = makeRedirectUri({ useProxy: true });
    console.log("🧭 Redirect URI generada con makeRedirectUri:", redirectTo);

    // 🔹 Inicia el flujo OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    console.log("📡 Respuesta de Supabase (signInWithOAuth):", data);

    if (error) {
      console.error("❌ Error al iniciar OAuth con Supabase:", error);
      throw new Error(error.message);
    }

    if (data?.url) {
      console.log("🔗 URL de autenticación de Google (Supabase):", data.url);

      // 🔹 Abre el navegador para autenticación
      console.log("🌐 Abriendo flujo OAuth en navegador...");
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      console.log("📦 Resultado WebBrowser (completo):", result);
      console.log("📍 Tipo de resultado:", result.type);

      if (result.type === "success" && result.url) {
        console.log("🔙 URL final devuelta por Google:", result.url);

        // --- Extra: mostrar el contenido completo del hash ---
        const urlParts = result.url.split("#");
        if (urlParts.length > 1) {
          console.log("🧩 Fragmento de autenticación (#hash):", urlParts[1]);
        }

        // --- Leer tokens del hash ---
        const params = new URLSearchParams(urlParts[1]);
        console.log("🔑 Access Token:", params.get("access_token"));
        console.log("🔄 Refresh Token:", params.get("refresh_token"));
        console.log("⏰ Expira en (segundos):", params.get("expires_in"));
        console.log("🪪 Token Type:", params.get("token_type"));

        // 🔹 Intercambia el token por una sesión en Supabase
        console.log("🛠 Intercambiando URL por sesión de Supabase...");
        const fragment = result.url.split("#")[1];
        const queryParams = new URLSearchParams(fragment);

        const access_token = queryParams.get("access_token");
        const refresh_token = queryParams.get("refresh_token");
        const expires_in = queryParams.get("expires_in");

        console.log("🧩 Fragmento completo:", fragment);
        console.log("🔑 Access Token extraído:", access_token);
        console.log("🔄 Refresh Token extraído:", refresh_token);
        console.log("⏰ Expira en:", expires_in);

        // ✅ Iniciar sesión en Supabase con los tokens
        const { data: sessionData, error: setSessionError } =
          await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

        if (setSessionError) {
          console.error("❌ Error al establecer sesión en Supabase:", setSessionError);
          Alert.alert("Error", "No se pudo establecer la sesión.");
        } else {
          console.log("🎉 Sesión de Supabase establecida correctamente:", sessionData);
          Alert.alert("Éxito", "Inicio de sesión con Google completado.");
        }
      } else {
        console.warn("⚠️ Flujo cancelado o no exitoso:", result.type);
      }
    } else {
      console.warn("⚠️ No se recibió data.url de Supabase");
    }
  } catch (e) {
    console.error("❌ Error general en el flujo OAuth:", e);
    Alert.alert("Error", "Ocurrió un error con Google: " + e.message);
  } finally {
    console.log("🏁 --- FIN DEL FLUJO DE LOGIN CON GOOGLE ---");
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