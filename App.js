// En: App.js

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert, View, ActivityIndicator, StyleSheet } from 'react-native'; 

// Importaciones de tus pantallas
import Home from './src/pages/Home';
import Login from './src/pages/login';
import PageAdmin from './src/pages/PageAdmin';
import RegisterArtesano from './src/pages/RegisterArtesano';
import ArtPage from './src/pages/ArtPage';
import ClientPage from './src/pages/ClientPage';
import NotFoundPage from './src/pages/NotFoundPage';

// Importación de Supabase
import { supabase } from './src/supabase/client';

// 1. Se crea el componente de carga una sola vez, fuera del renderizado.
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

  // 2. Se restaura la lógica COMPLETA del useEffect.
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session && session.user) {
        const { data, error } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error("Error al obtener el perfil:", error);
          setRole(null);
        } else if (data && data.rol) {
          setRole(data.rol);
        } else {
          setRole(null);
          Alert.alert(
            'Error de Permisos', 
            'No tienes un rol definido en el sistema. Serás desconectado.'
          );
          await supabase.auth.signOut(); 
        }
      } else {
        setRole(null);
      }
      
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  // Si la app está en su carga inicial, muestra el spinner
  if (loading) {
    return <LoadingScreen />;
  }

  function renderScreens(rol) {
    // Si hay sesión pero aún no se carga el rol, muestra el spinner
    if (!rol) {
      return <Stack.Screen name="LoadingRole" component={LoadingScreen} options={{ headerShown: false }} />;
    }

    switch (rol) {
      case 'admin':
        return (
          <>
            <Stack.Screen name="PageAdmin" component={PageAdmin} options={{title: 'Modo Admin'}} />
            <Stack.Screen name="RegisterArtesano" component={RegisterArtesano} options={{title: 'Registro de datos'}} />
            <Stack.Screen name="Home" component={Home} options={{ title: 'Home' }} />
          </>
        );
      case 'artesano':
        return <Stack.Screen name="ArtPage" component={ArtPage} options={{ title: 'Pagina del artesano' }} />;
      case 'cliente':
        return <Stack.Screen name="ClientPage" component={ClientPage} options={{ title: 'Página del cliente' }} />;
      default:
        return <Stack.Screen name="NotFound" component={NotFoundPage} options={{ title: 'Error' }} />;
    }
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {session && session.user ? (
          renderScreens(role)
        ) : (
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5', // Opcional: para que el fondo no sea blanco puro
    }
});