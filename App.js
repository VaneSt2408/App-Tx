// App.js
import 'react-native-url-polyfill/auto';
import React, { useState, useEffect } from 'react';
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
import ChangePassword from './src/pages/ChangePassword';

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(`📡 Evento de Auth recibido: ${_event}`);
      console.log('📦 Objeto de sesión:', JSON.stringify(session, null, 2));
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        console.log("🔍 Buscando perfil para el usuario:", session.user.id);
        const { data: profile, error, status } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', session.user.id)
          .single();

        if (error && status !== 406) {
          throw error;
        }

        if (profile?.rol) {
          console.log("✅ Rol detectado exitosamente:", profile.rol);
          setRole(profile.rol);
        } else {
          console.warn("⚠️ No se encontró un perfil para este usuario o el campo 'rol' está vacío.");
          setRole(null);
        }
      } catch (err) {
        console.error("❌ Error crítico obteniendo el rol:", err.message);
        setRole(null);
        Alert.alert("Error de Perfil", "No pudimos verificar tu información.");
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [session]);

  useEffect(() => {
    const handleDeepLink = async (url) => {
      if (!url) return;
      console.log('🔗 URL de Deep Link recibida:', url);
      
      const params = new URLSearchParams(url.split('#')[1] || '');
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      console.log('🔑 Access Token extraído:', access_token ? '...' + access_token.slice(-6) : null);
      console.log('🔄 Refresh Token extraído:', refresh_token ? '...' + refresh_token.slice(-6) : null);

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) console.error("❌ Error al establecer sesión desde deep link:", error);
      }
    };
    
    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url); });
    const linkingListener = Linking.addEventListener('url', (e) => handleDeepLink(e.url));

    return () => linkingListener.remove();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const renderScreens = () => {
    if (!session?.user) {
      return <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />;
    }
    
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
        return (
          <>
            <Stack.Screen name="RegisterArtesano" component={RegisterArtesano} options={{ title: 'Completa tu Registro' }} />
            <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ title: 'Establecer una contraseña' }} />
          </>
        );
      
      // --- ✅ CAMBIO PRINCIPAL ---
      // Manejamos explícitamente el caso donde tenemos sesión pero aún no hay rol.
      // En este estado, mostramos la pantalla de carga.
      case null:
        return <Stack.Screen name="LoadingRole" component={LoadingScreen} options={{ headerShown: false }} />;

      default:
        // El caso 'default' ahora solo se activará si el rol es una cadena de texto
        // inesperada, lo cual sí es un error.
        return <Stack.Screen name="NotFound" component={NotFoundPage} options={{ title: 'Error de Rol' }} />;
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>{renderScreens()}</Stack.Navigator>
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
