// app/(app)/_layout.tsx

import { Stack, useRouter, Href } from 'expo-router';
import { useEffect } from 'react'; // ⬅️ Reutilizamos el hook con tu lógica de App.js
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import {FilterProvider} from '../../src/context/FilterContext';

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

    const targetRoute = routeMapping[role as keyof typeof routeMapping];


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
    <FilterProvider>
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="PageAdmin" options={{ title: "Modo Admin" }} />
      <Stack.Screen name="MagicLink" options={{ title: "Envio de link" }} />
      <Stack.Screen name="RegisterArtesano" options={{ headerShown: false}} />
      <Stack.Screen name="ArtPage" options={{ title: "Pagina del artesano" }} />
      <Stack.Screen name="ClientPage" options={{ title: "Pagina del cliente", headerBackVisible: false }} />
      <Stack.Screen name="ChangePassword" options={{ title: "Confirmar contraseña" }} />
      <Stack.Screen name="NotFoundPage" options={{ title: "Error de permisos" }} />
      <Stack.Screen name="clientProfile" options={{ title: "" }} />
      <Stack.Screen name="ArtesanoProfile" options={{ title: "Perfil del Artesano", headerShown: false }} />
      <Stack.Screen name="ArtesanoList" options={{ title: "Lista de artesanos" }} />
      <Stack.Screen name="ArtesanoPublications" options={{ title: "Mis Publicaciones" }} />
      <Stack.Screen name="ArtesanoProducts" options={{ title: "Mis Productos" }} />
      <Stack.Screen name="CreatePostPage" options={{title: "Crea una publicacion"}}/>
      <Stack.Screen name="FeedPage" options={{title: "Publicaciones"}}/>
      <Stack.Screen name="MarketplacePage" options={{title: "Marketplace"}}/>
      <Stack.Screen name="ProductDetailPage" options={{title: "Detalle del Producto"}}/>
      <Stack.Screen name="estadisticas" options={{title: "Estadisticas"}}/>
      <Stack.Screen name="Eventos" options={{title: "Eventos"}}/>
      <Stack.Screen name="EditEventPage" options={{title: "Editar evento"}}/>
      <Stack.Screen name="CreateEventPage" options={{title: "Crear evento"}}/>
      <Stack.Screen name="ArtesanoSettings" options={{title: "Ajustes de perfil del artesano"}}/>
      <Stack.Screen name="ArtesanoProfileVistaVisitante" options={{title: "Ver perfil como visitante", headerBackVisible: false}}/>
      <Stack.Screen name="MarketplaceFilters" options={{title: "Filtros de Marketplace", headerShown: false}}/>
      <Stack.Screen name="perfilcliente" options={{title: "Perfil del cliente", headerBackVisible: false}}/>
      <Stack.Screen name="gestionCuentaCliente" options={{ title: "Gestion de cuenta del cliente", headerBackVisible: false }} />
      <Stack.Screen name="ayudaSoporte" options={{ title: "Ayuda y Soporte", headerBackVisible: false }} />
      <Stack.Screen name="TerminoCondiciones" options={{ title: "Términos y Condiciones", headerBackVisible: false }} />
      <Stack.Screen name="AppSettings" options={{ title: "Configuración de la App", headerBackVisible: false }} />
    </Stack>
        </FilterProvider>
  );
}