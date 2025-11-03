// app/_layout.tsx

import { AuthProvider, useAuth } from '../src/context/AuthContext'; // Asegúrate que la ruta a tu contexto sea correcta
import { Slot, useRouter, useSegments, Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

const LoadingScreen = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2575fc" />
    </View>
);

// Este es el componente que contiene toda la lógica de navegación.
// Necesita estar separado para poder usar el hook 'useAuth'.
function RootLayoutNav() {
  const { session, role, profile, loading: authLoading, isPasswordRecovery } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {

    // Si el estado de autenticación aún está cargando, no hacemos nada.
    if (authLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inCompleteProfile = segments[0] === 'completeProfile';
    const inCompleteArtesanoProfile = segments[0] === 'completeArtesanoProfile';

    // Si estamos en modo de recuperación de contraseña, no redirigir automáticamente
    if (isPasswordRecovery) {
      return;
    }

    // Si NO hay sesión de usuario...
    if (!session?.user) {
      // y no estamos ya en el grupo de autenticación, redirigimos a auth.
      if (!inAuthGroup) {
        router.replace('/(auth)'); // No es necesario el 'as Href'
      }
    } 
    // Si SÍ hay sesión de usuario...
    else {
      // Verificar si es un cliente que necesita completar su perfil
      if (role === 'cliente' && profile && !profile.nombre_completo) {
        if (!inCompleteProfile) {
          router.replace('/completeProfile' as Href);
        }
        return;
      }

      // Si estamos en completeProfile pero ya no necesitamos completar el perfil
      if (inCompleteProfile && role === 'cliente' && profile?.nombre_completo) {
        router.replace('/(app)' as Href);
        return;
      }

      // Verificar si es un artesano que necesita completar su perfil
      // (falta descripcion o avatar_url)
      if (role === 'artesano' && profile) {
        const tieneDescripcion = !!profile.descripcion;
        const tieneAvatar = !!profile.avatar_url;
        const perfilCompleto = tieneDescripcion && tieneAvatar;

        if (!perfilCompleto) {
          if (!inCompleteArtesanoProfile) {
            router.replace('/completeArtesanoProfile' as Href);
          }
          return;
        }
      }

      // Si estamos en completeArtesanoProfile pero ya no necesitamos completar el perfil
      if (inCompleteArtesanoProfile && role === 'artesano' && profile) {
        const tieneDescripcion = !!profile.descripcion;
        const tieneAvatar = !!profile.avatar_url;
        const perfilCompleto = tieneDescripcion && tieneAvatar;

        if (perfilCompleto) {
          router.replace('/(app)' as Href);
          return;
        }
      }

      // Si estamos en el grupo de autenticación (ej. en la pantalla de login),
      // redirigimos al grupo principal de la app.
      if (inAuthGroup) {
        // Asegúrate que esta ruta es correcta. 
        // Por ejemplo, puede ser '/(app)/home' o '/(app)/tabs'
        router.replace('/(app)' as Href); 
      }
    }
  }, [session, role, profile, authLoading, segments, isPasswordRecovery, router]); // Dependemos de los estados clave incluyendo profile.

  // Mientras carga la sesión, mostramos el indicador.
  if (authLoading) {
    return <LoadingScreen />;
  }

  return <Slot />;
}

// Este es el componente principal que se exporta.
// Su única función es envolver la app con el AuthProvider.
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}