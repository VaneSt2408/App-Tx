import React, { useState, useEffect } from 'react'; // En: App.js
import { NavigationContainer } from '@react-navigation/native'; // En: App.js
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // En: App.js
import { Alert, View, ActivityIndicator, StyleSheet } from 'react-native'; // En: App.js

// Importaciones de tus pantallas
import Home from './src/pages/Home'; // En: App.js
import Login from './src/pages/login'; // En: App.js
import PageAdmin from './src/pages/PageAdmin'; // En: App.js
import RegisterArtesano from './src/pages/RegisterArtesano'; // En: App.js
import ArtPage from './src/pages/ArtPage'; // En: App.js
import ClientPage from './src/pages/ClientPage'; // En: App.js
import NotFoundPage from './src/pages/NotFoundPage'; // En: App.js

// Importación de Supabase
import { supabase } from './src/supabase/client'; // En: App.js

// 1. Se crea el componente de carga una sola vez, fuera del renderizado.
const LoadingScreen = () => ( // En: App.js
  <View style={styles.loadingContainer}> 
    <ActivityIndicator size="large" color="#2575fc" />
  </View>
);

const Stack = createNativeStackNavigator(); // En: App.js

export default function App() {
  const [session, setSession] = useState(null); //Estado para manejar la sesión
  const [role, setRole] = useState(null); // Estado para manejar el rol del usuario
  const [loading, setLoading] = useState(true); // Estado para manejar la carga inicial

  // 2. Se restaura la lógica COMPLETA del useEffect.
  useEffect(() => { 
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => { // Escucha los cambios en el estado de autenticación
      setSession(session); // Actualiza la sesión
      
      if (session && session.user) { // Si hay sesión, obtiene el rol del usuario
        const { data, error } = await supabase 
          .from('perfiles')
          .select('rol')
          .eq('id', session.user.id)
          .single(); // Asegura que solo se obtenga un registro
        
        if (error) { // Manejo de errores
          console.error("Error al obtener el perfil:", error); // En consola para desarrollo
          setRole(null); // Resetea el rol en caso de error
        } else if (data && data.rol) { // Si se obtiene el rol correctamente
          setRole(data.rol); // Actualiza el estado del rol
        } else { // Si no se encuentra el rol, maneja el caso adecuadamente
          setRole(null); // Resetea el rol
          Alert.alert(
            'Error de Permisos', 
            'No tienes un rol definido en el sistema. Serás desconectado.'
          ); // Notifica al usuario
          await supabase.auth.signOut(); // Cierra la sesión
        }
      } else {
        setRole(null); // Si no hay sesión, resetea el rol
      }
      
      setLoading(false); // Finaliza el estado de carga inicial
    });

    return () => {
      authListener?.subscription.unsubscribe(); // Limpia el listener al desmontar el componente
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