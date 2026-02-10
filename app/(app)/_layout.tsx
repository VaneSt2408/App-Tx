// app/(app)/_layout.tsx

import { Stack, useRouter, Href } from 'expo-router';
import { useEffect } from 'react'; // ⬅️ Reutilizamos el hook con tu lógica de App.js
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { FilterProvider } from '../../src/context/FilterContext';

// Componente de carga, similar al de tu App.js
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#9D046D" />
  </View>
);

export default function AppLayout() {
  // 1. Usamos tu lógica de nuevo, pero ahora nos enfocamos en el 'role'.
  const { role, loading: authLoading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {

    if (!session) {
      return;
    }
    // Si el hook todavía está obteniendo el rol, no hacemos nada.
    if (authLoading || !role) {
      return;
    }

    // 2. Aquí está tu 'switch' de App.js, convertido en un mapa de rutas.
    const routeMapping = {
      admin: '/PageAdmin',
      artesano: '/ArtPage',
      cliente: '/ClientPage',
      'En proceso': '/RegisterArtesano',
    };

    const targetRoute = routeMapping[role as keyof typeof routeMapping];


    // 3. Redirigimos al usuario a la pantalla que le corresponde.
    if (targetRoute) {
      router.replace(targetRoute as Href);
    } else {
      // Este es el 'default' de tu switch.
      router.replace('/(app)/NotFoundPage' as Href);
    }
  }, [role, authLoading, session, router]); // El efecto se ejecuta cuando el rol esté listo.

  // 4. Mientras se obtiene el rol, mostramos una carga (igual que tu 'if (!role)' en App.js).
  if (authLoading || !role) {
    return <LoadingScreen />;
  }

  // 5. Definimos TODAS las pantallas posibles del área privada.
  // Esto reemplaza tener que listarlas dentro de cada 'case' del switch.
  return (
    <FilterProvider>
      <Stack>
        {/* Rutas principales y de navegación */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="NotFoundPage" options={{ headerTitle: '', headerShadowVisible: false }} />

        {/* Rutas de Admin */}
        <Stack.Screen name="PageAdmin" options={{ headerTitle: '', headerShadowVisible: false }} />
        <Stack.Screen name="MagicLink" options={{ headerTitle: '', headerShadowVisible: false }} />
        <Stack.Screen name="ArtesanoList" options={{ headerTitle: '', headerShadowVisible: false }} />
        <Stack.Screen name="estadisticas" options={{ headerTitle: '', headerShadowVisible: false }} />
        <Stack.Screen name="Eventos" options={{ headerTitle: '', headerShadowVisible: false }} />
        <Stack.Screen name="EditEventPage" options={{ headerTitle: '', headerShadowVisible: false }} />
        <Stack.Screen name="CreateEventPage" options={{ headerTitle: '', headerShadowVisible: false }} />

        {/* Rutas de Artesano */}
        <Stack.Screen name="RegisterArtesano" options={{ headerShown: false }} />
        <Stack.Screen name="completeArtesanoProfile" options={{ headerShown: false }} />
        <Stack.Screen name="ArtPage" options={{ headerShown: false }} />
        <Stack.Screen name="ArtesanoProducts" options={{ headerTitle: '', headerShadowVisible: false }} />
        <Stack.Screen name="ArtesanoPublications" options={{ headerTitle: '', headerShadowVisible: false }} />
        <Stack.Screen name="CreatePostPage" options={{ headerTitle: '', headerShadowVisible: false }} />
        <Stack.Screen name="gestionCuentaArtesano" options={{ headerTitle: '', headerShadowVisible: false }} />
        <Stack.Screen name="AjustesPerfilArtesano" options={{ headerTitle: '', headerShadowVisible: false }} />

        {/* Rutas de Cliente */}
        <Stack.Screen name="ClientPage" options={{ headerShown: false }} />
        <Stack.Screen name="gestionCuentaCliente" options={{ headerShown: false }} />

        {/* Rutas Comunes y de Ajustes */}
        <Stack.Screen name="perfilcliente" options={{ headerShown: false }} />
        <Stack.Screen name="ArtesanoProfileVistaVisitante" options={{ headerShown: false }} />
        <Stack.Screen name="ProductDetailPage" options={{ headerShown: false }} />
        <Stack.Screen name="AppSettings" options={{ headerShown: false }} />
        <Stack.Screen name="ayudaSoporte" options={{ headerShown: false }} />
        <Stack.Screen name="TerminoCondiciones" options={{ headerShown: false }} />
      </Stack>
    </FilterProvider>
  );
}