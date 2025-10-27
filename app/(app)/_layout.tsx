// app/(app)/_layout.tsx

import { Stack, useRouter, Href } from 'expo-router';
import { useEffect } from 'react'; // ⬅️ Reutilizamos el hook con tu lógica de App.js
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
// Componente de carga, similar al de tu App.js
const LoadingScreen = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2575fc" />
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

    console.log('--- DEBUG DE ROL ---');
    console.log('Rol recibido del contexto:', role);
    console.log('¿Existe la clave en routeMapping?:', role in routeMapping);
    const targetRoute = routeMapping[role as keyof typeof routeMapping];
    console.log('Ruta de destino calculada:', targetRoute);
    console.log('---------------------');


    // 3. Redirigimos al usuario a la pantalla que le corresponde.
    if (targetRoute) {
      router.replace(targetRoute as Href);
    } else {
      // Este es el 'default' de tu switch.
      router.replace('/(app)/NotFoundPage' as Href);
    }
  }, [role, authLoading, session]); // El efecto se ejecuta cuando el rol esté listo.

  // 4. Mientras se obtiene el rol, mostramos una carga (igual que tu 'if (!role)' en App.js).
  if (authLoading || !role) {
    return <LoadingScreen />;
  }

  // 5. Definimos TODAS las pantallas posibles del área privada.
  // Esto reemplaza tener que listarlas dentro de cada 'case' del switch.
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="PageAdmin" options={{ title: "Modo Admin" }} />
      <Stack.Screen name="MagicLink" options={{ title: "Envio de link" }} />
      <Stack.Screen name="RegisterArtesano" options={{ title: "Registro de datos personales" }} />
      <Stack.Screen name="ArtPage" options={{ title: "Pagina del artesano" }} />
      <Stack.Screen name="ClientPage" options={{ title: "Pagina del cliente" }} />
      <Stack.Screen name="ChangePassword" options={{ title: "Confirmar contraseña" }} />
      <Stack.Screen name="NotFoundPage" options={{ title: "Error de permisos" }} />
      <Stack.Screen name="clientProfile" options={{ title: "" }} />
      <Stack.Screen name="ArtesanoProfile" options={{ title: "Perfil del Artesano" }} />
      <Stack.Screen name="ArtesanoList" options={{ title: "Lista de artesanos" }} />
      <Stack.Screen name="CreatePostPage" options={{title: "Crea una publicacion"}}/>
      <Stack.Screen name="FeedPage" options={{title: "Publicaciones"}}/>
      <Stack.Screen name="MarketplacePage" options={{title: "Marketplace"}}/>
      <Stack.Screen name="ProductDetailPage" options={{title: "Detalle del Producto"}}/>
    </Stack>
  );
}