// App.js
import React, { useState, useEffect, useRef } from 'react';
import { Alert, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { supabase } from './src/supabase/client';

// Pantallas
import Login from './src/pages/login';
import PageAdmin from './src/pages/PageAdmin';
import RegisterArtesano from './src/pages/RegisterArtesano';
import ArtPage from './src/pages/ArtPage';
import ClientPage from './src/pages/ClientPage';
import NotFoundPage from './src/pages/NotFoundPage';
import MagicLink from './src/pages/MagicLink';

// Componente de carga
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#2575fc" />
  </View>
);

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Flag para bloquear el listener de Supabase mientras se procesa un deep link
  const handlingDeepLinkRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // --- Manejo del deep link ---
    const handleDeepLink = async (url) => {
      if (!url || !isMounted) return;
      console.log("🔗 Deep link detectado:", url);

      handlingDeepLinkRef.current = true;

      try {
        const params = new URLSearchParams(url.split('#')[1] || '');
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (!access_token || !refresh_token) {
          console.log("⚠️ El enlace no contiene tokens válidos.");
          if (isMounted) setLoading(false);
          handlingDeepLinkRef.current = false;
          return;
        }

        // Establece sesión en Supabase
        const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) {
          console.error("❌ Error al establecer sesión desde deep link:", error);
          Alert.alert("Error", "No se pudo iniciar sesión desde el enlace. Intenta manualmente.");
          if (isMounted) {
            setSession(null);
            setRole(null);
            setLoading(false);
          }
          handlingDeepLinkRef.current = false;
          return;
        }

        // Forzar actualización de estado y pantalla
        if (data?.session && isMounted) {
          console.log("✅ Sesión establecida manualmente:", data.session.user.email);
          setSession(data.session);

          try {
            const { data: profileData, error: roleError } = await supabase
              .from('perfiles')
              .select('rol')
              .eq('id', data.session.user.id)
              .single();
            if (roleError) {
              console.error("Error obteniendo rol:", roleError);
              setRole(null);
            } else {
              setRole(profileData?.rol || null);
            }
          } catch (err) {
            console.error("Error fetch rol:", err);
            setRole(null);
          }

          setLoading(false); // ✅ Aquí forzamos la UI inmediatamente
        }
      } catch (err) {
        console.error("Error procesando deep link:", err);
        if (isMounted) setLoading(false);
      } finally {
        handlingDeepLinkRef.current = false;
      }
    };

    // --- Verificar sesión local ---
    const checkSession = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (!existingSession) {
          setSession(null);
          setRole(null);
          setLoading(false);
          return;
        }

        const isExpired = existingSession.expires_at && existingSession.expires_at * 1000 < Date.now();
        if (isExpired) {
          await supabase.auth.signOut();
          setSession(null);
          setRole(null);
          setLoading(false);
          return;
        }

        setSession(existingSession);

        try {
          const { data: profile } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', existingSession.user.id)
            .single();
          setRole(profile?.rol || null);
        } catch (err) {
          console.error("Error obteniendo rol en checkSession:", err);
          setRole(null);
        }
      } catch (err) {
        console.error("Error en checkSession:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // --- Inicialización ---
    (async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          await handleDeepLink(initialUrl);
        } else {
          await checkSession();
        }
      } catch (err) {
        console.error("Error init:", err);
        if (isMounted) setLoading(false);
      }
    })();

    // --- Escucha de deep links mientras la app está abierta ---
    const linkingListener = Linking.addEventListener('url', (e) => {
      handleDeepLink(e.url);
    });

    // --- Listener de Supabase ---
    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (handlingDeepLinkRef.current) {
        console.log("⚠️ Ignorando onAuthStateChange porque se está manejando deep link");
        return;
      }

      if (!isMounted) return;
      console.log("📡 Evento de autenticación:", event);

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setRole(null);
        setLoading(false);
      } else if (newSession) {
        setSession(newSession);
        try {
          const { data: profile } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', newSession.user.id)
            .single();
          setRole(profile?.rol || null);
        } catch (err) {
          console.error("Error obteniendo rol en listener:", err);
          setRole(null);
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      linkingListener.remove();
      subscription?.unsubscribe();
    };
  }, []);

  // --- Renderizado condicional según estado y rol ---
  if (loading) return <LoadingScreen />;

  const renderScreens = () => {
    if (!session || !session.user) return <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />;
    if (!role) return <Stack.Screen name="LoadingRole" component={LoadingScreen} options={{ headerShown: false }} />;

    switch (role) {
      case 'admin':
        return (
          <>
            <Stack.Screen name="PageAdmin" component={PageAdmin} options={{ title: 'Modo Admin' }} />
            <Stack.Screen name="MagicLink" component={MagicLink} options={{ title: 'Invitar Artesano' }} />
          </>
        );
      case 'artesano':
        return <Stack.Screen name="ArtPage" component={ArtPage} options={{ title: 'Página del Artesano' }} />;
      case 'cliente':
        return <Stack.Screen name="ClientPage" component={ClientPage} options={{ title: 'Página del Cliente' }} />;
      case 'En proceso':
        return <Stack.Screen name="RegisterArtesano" component={RegisterArtesano} options={{ title: 'Completa tu Registro' }} />;
      default:
        return <Stack.Screen name="NotFound" component={NotFoundPage} options={{ title: 'Error' }} />;
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {renderScreens()}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
