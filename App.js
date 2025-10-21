// App.js
import 'react-native-url-polyfill/auto'; // Polyfill necesario para que la librería de Supabase funcione correctamente en React Native.
import React, { useState, useEffect } from 'react'; // Importa React y los hooks 'useState' y 'useEffect'.
import { Alert, View, ActivityIndicator, StyleSheet } from 'react-native'; // Importa componentes de UI de React Native.
import { NavigationContainer } from '@react-navigation/native'; // Contenedor principal para la navegación de la app.
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Importa el creador de navegación tipo "stack" (pantallas apiladas).
import * as Linking from 'expo-linking'; // Importa la librería de Expo para manejar deep links (abrir la app desde un URL).
import { supabase } from './src/supabase/client'; // Importa el cliente de Supabase.

// --- Importación de todas las pantallas de la aplicación ---
import Login from './src/pages/login';
import PageAdmin from './src/pages/PageAdmin';
import RegisterArtesano from './src/pages/RegisterArtesano';
import ArtPage from './src/pages/ArtPage';
import ClientPage from './src/pages/ClientPage';
import NotFoundPage from './src/pages/NotFoundPage';
import MagicLink from './src/pages/MagicLink';
import ChangePassword from './src/pages/ChangePassword';

// --- Componente simple para mostrar una pantalla de carga ---
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#2575fc" />
  </View>
);

// Inicializa el navegador de tipo Stack.
const Stack = createNativeStackNavigator();

// --- Componente principal de la aplicación ---
export default function App() {
  // --- Estados globales de la aplicación ---
  const [session, setSession] = useState(null); // Almacena la sesión del usuario (si está logueado o no).
  const [role, setRole] = useState(null); // Almacena el rol del usuario ('admin', 'artesano', etc.).
  const [loading, setLoading] = useState(true); // Controla la visualización de la pantalla de carga inicial.

  // --- useEffect para manejar la sesión de autenticación ---
  useEffect(() => {
    // Intenta obtener la sesión activa la primera vez que la app carga.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); // Establece la sesión encontrada.
      // Si no hay sesión, significa que el usuario no está logueado, por lo que se deja de cargar.
      if (!session) {
        setLoading(false);
      }
    });

    // Crea un "oyente" (listener) que se activa cada vez que hay un cambio en el estado de autenticación.
    // Ejemplos de eventos: SIGNED_IN, SIGNED_OUT, USER_UPDATED.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(`📡 Evento de Auth recibido: ${_event}`); // Muestra el evento en consola.
      setSession(session); // Actualiza el estado de la sesión con la nueva información.
    });

    // Función de limpieza: se ejecuta cuando el componente se desmonta.
    // Es crucial para evitar fugas de memoria al eliminar la suscripción.
    return () => subscription.unsubscribe();
  }, []); // El array vacío `[]` asegura que este efecto se ejecute solo una vez.

  // --- useEffect para obtener el rol del usuario cuando cambia la sesión ---
  useEffect(() => {
    // Si no hay una sesión de usuario, resetea el rol y termina la carga.
    if (!session?.user) {
      setRole(null);
      setLoading(false);
      return; // Detiene la ejecución del efecto.
    }

    // Define una función asíncrona para buscar el rol en la base de datos.
    const fetchRole = async () => {
      try {
        console.log("🔍 Buscando perfil para el usuario:", session.user.id);
        // Realiza una consulta a la tabla 'perfiles' para obtener el 'rol' del usuario actual.
        const { data: profile, error, status } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', session.user.id) // Filtra por el ID del usuario de la sesión.
          .single(); // Espera un único resultado.

        // Si hay un error y no es el código 406 (que significa 'no se encontró fila'), lanza el error.
        if (error && status !== 406) {
          throw error;
        }

        // Si se encuentra un perfil con un rol, lo establece en el estado.
        if (profile?.rol) {
          console.log("✅ Rol detectado exitosamente:", profile.rol);
          setRole(profile.rol);
        } else { // Si no se encuentra un perfil o el rol es nulo.
          console.warn("⚠️ No se encontró un perfil para este usuario.");
          setRole(null);
        }
      } catch (err) { // Captura cualquier error durante la obtención del rol.
        console.error("❌ Error crítico obteniendo el rol:", err.message);
        setRole(null); // Resetea el rol en caso de error.
        Alert.alert("Error de Perfil", "No pudimos verificar tu información.");
      } finally { // Este bloque se ejecuta siempre, con o sin errores.
        setLoading(false); // Finaliza el estado de carga para mostrar la app.
      }
    };

    fetchRole(); // Llama a la función para que se ejecute.
  }, [session]); // Este efecto se vuelve a ejecutar cada vez que el estado 'session' cambia.

  // --- useEffect para manejar Deep Links (enlaces mágicos) ---
  useEffect(() => {
    // Función que procesa el URL recibido por el deep link.
    const handleDeepLink = async (url) => {
      if (!url) return;
      console.log('🔗 URL de Deep Link recibida:', url);
      
      // Extrae los tokens de autenticación del fragmento (#) de la URL.
      const params = new URLSearchParams(url.split('#')[1] || '');
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      // Si se encuentran ambos tokens, se usan para establecer la sesión en Supabase.
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }
    };
    
    // Revisa si la app fue abierta por un deep link.
    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url); });
    // Añade un listener para manejar deep links mientras la app ya está abierta.
    const linkingListener = Linking.addEventListener('url', (e) => handleDeepLink(e.url));

    // Función de limpieza para remover el listener.
    return () => linkingListener.remove();
  }, []); // Se ejecuta solo una vez.

  // --- Renderizado Condicional ---

  // Mientras el estado 'loading' sea verdadero, muestra la pantalla de carga.
  if (loading) {
    return <LoadingScreen />;
  }

  // Función que decide qué pantallas mostrar basado en la sesión y el rol.
  const renderScreens = () => {
    // Si no hay sesión de usuario, solo muestra la pantalla de Login.
    if (!session?.user) {
      return <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />;
    }
    
    // Si hay sesión, decide qué mostrar basado en el rol del usuario.
    switch (role) {
      case 'admin':
        // Si el rol es 'admin', muestra las pantallas de administración.
        return (
          <>
            <Stack.Screen name="PageAdmin" component={PageAdmin} options={{ title: 'Modo Admin' }} />
            <Stack.Screen name="MagicLink" component={MagicLink} options={{ title: 'Invitar Artesano' }} />
          </>
        );
      case 'artesano':
        // Si el rol es 'artesano', muestra su página principal.
        return <Stack.Screen name="ArtPage" component={ArtPage} options={{ title: 'Página del Artesano' }} />;
      case 'cliente':
        // Si el rol es 'cliente', muestra su página principal.
        return <Stack.Screen name="ClientPage" component={ClientPage} options={{ title: 'Página del Cliente' }} />;
      case 'En proceso':
        // Si el rol es 'En proceso', significa que es un artesano que debe completar su registro.
        return (
          <>
            <Stack.Screen name="RegisterArtesano" component={RegisterArtesano} options={{ title: 'Completa tu Registro' }} />
            <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ title: 'Establecer una contraseña' }} />
          </>
        );
      case null:
        // Si hay sesión pero el rol aún es 'null', significa que se está cargando. Muestra la pantalla de carga.
        return <Stack.Screen name="LoadingRole" component={LoadingScreen} options={{ headerShown: false }} />;
      default:
        // Si el rol es cualquier otra cosa inesperada, muestra una página de error.
        return <Stack.Screen name="NotFound" component={NotFoundPage} options={{ title: 'Error de Rol' }} />;
    }
  };

  // --- Renderizado final del componente ---
  return (
    // Envuelve toda la aplicación en el contenedor de navegación.
    <NavigationContainer>
      {/* Define el navegador de Stack y le pasa las pantallas a renderizar. */}
      <Stack.Navigator>{renderScreens()}</Stack.Navigator>
    </NavigationContainer>
  );
}

// --- Hoja de estilos para el componente ---
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, // Ocupa todo el espacio disponible.
    justifyContent: 'center', // Centra verticalmente.
    alignItems: 'center', // Centra horizontalmente.
    backgroundColor: '#f5f5f5', // Color de fondo.
  },
});