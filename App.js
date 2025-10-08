// En: App.js

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './src/pages/Home';
import Login from './src/pages/login';
import PageAdmin from './src/pages/PageAdmin';
import RegisterArtesano from './src/pages/RegisterArtesano';
import { supabase } from './src/supabase/client';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {session && session.user ? (
          <>
            <Stack.Screen name="Home" component={Home} options={{ title: 'Home' }} />
            <Stack.Screen name="PageAdmin" component={PageAdmin} options={{ title: 'Modo Admin' }} />
            <Stack.Screen name="RegisterArtesano" component={RegisterArtesano} options={{ title: 'Registro de datos' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}