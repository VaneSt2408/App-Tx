// App.js
import 'react-native-url-polyfill/auto';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking'; // Tu equipo lo usa para deep links
import { supabase } from './src/supabase/client'; // Importas supabase aquí
import { onAuthStateChange, checkUserRole } from './src/services/authService';

// --- Importación de todas las pantallas ---
import Login from './src/pages/login';
import RegisterPage from './src/pages/RegisterPage';
import PageAdmin from './src/pages/PageAdmin';
import RegisterArtesano from './src/pages/RegisterArtesano';
import ArtPage from './src/pages/ArtPage';
import ClientPage from './src/pages/ClientPage';
import NotFoundPage from './src/pages/NotFoundPage';
import MagicLink from './src/pages/MagicLink';
import ChangePassword from './src/pages/ChangePassword';
import CompleteProfilePage from './src/pages/CompleteProfilePage';
import CreatePostPage from './src/pages/CreatePostPage'; 

// --- Componente simple para mostrar una pantalla de carga ---
const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2575fc" />
    </View>
);

// Inicializa el navegador de tipo Stack.
const Stack = createNativeStackNavigator();

export default function App() {
    // --- CAMBIO: Simplificamos los estados a solo 3 ---
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null); // 'profile' ahora contiene toda la info, incluido el rol.
    const [loading, setLoading] = useState(true);

    // --- CAMBIO: LÓGICA DE AUTENTICACIÓN UNIFICADA EN UN SOLO useEffect ---
    // Este es ahora el único lugar que maneja el estado del usuario.
    useEffect(() => {
        const { data: { subscription } } = onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session?.user) {
                const userProfile = await checkUserRole(session.user.id);
                setProfile(userProfile);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []); // Se ejecuta solo una vez al iniciar la app.

    // --- Tu función para refrescar el perfil (permanece igual) ---
    const handleProfileCompletion = async () => {
        setLoading(true);
        if (session?.user) {
            const userProfile = await checkUserRole(session.user.id);
            // --- LÍNEA DE DEPURACIÓN CLAVE ---
            // Vamos a ver qué nos devuelve la base de datos DESPUÉS de guardar.
            console.log('PERFIL OBTENIDO DENTRO DE handleProfileCompletion:', JSON.stringify(userProfile, null, 2));
            // ------------------------------------

            setProfile(userProfile);
        }
        setLoading(false);
    };

    // --- Tu useEffect para Deep Links (permanece igual) ---
    useEffect(() => {
        const handleDeepLink = async (url) => {
            if (!url) return;
            const params = new URLSearchParams(url.split('#')[1] || '');
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            if (access_token && refresh_token) {
                await supabase.auth.setSession({ access_token, refresh_token });
            }
        };
        Linking.getInitialURL().then(url => { if (url) handleDeepLink(url); });
        const linkingListener = Linking.addEventListener('url', (e) => handleDeepLink(e.url));
        return () => linkingListener.remove();
    }, []);

    if (loading) {
        return <LoadingScreen />;
    }

    // --- Función de renderizado con la nueva lógica ---
    const renderScreens = () => {
        // 1. Si NO hay sesión, muestra Login y Registro.
        if (!session?.user) {
            return (
                <>
                    <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
                    <Stack.Screen name="Register" component={RegisterPage} options={{ title: 'Crear Cuenta' }} />
                </>
            );
        }

        // --- ESTA ES LA NUEVA LÓGICA INTELIGENTE ---
        // 2. Si SÍ hay sesión, y el perfil es de un 'cliente' PERO
        // aún no tiene un 'nombre_completo', lo forzamos a completar su perfil.
        if (session.user && profile?.rol === 'cliente' && !profile?.nombre_completo) {
            return (
                <Stack.Screen
                    name="CompleteProfile"
                    component={CompleteProfilePage}
                    options={{ title: 'Completa tu Perfil', headerShown: false }}
                    initialParams={{ onProfileComplete: handleProfileCompletion }}
                />
            );
        }

        // 3. Si el usuario está logueado y su perfil está completo, usamos la lógica de tu equipo.
        switch (profile?.rol) {
            case 'admin':
                return (
                    <>
                        <Stack.Screen name="PageAdmin" component={PageAdmin} options={{ title: 'Modo Admin' }} />
                        <Stack.Screen name="MagicLink" component={MagicLink} options={{ title: 'Invitar Artesano' }} />
                    </>
                );
            case 'artesano':
                return (
                <>
                <Stack.Screen name="ArtPage" component={ArtPage} options={{ title: 'Página del Artesano' }} />
                <Stack.Screen
                            name="CreatePost"
                            component={CreatePostPage}
                            options={{ headerShown: false }} // Ya tiene header personalizado
                            />
                            </>
                );

            case 'cliente':
                return <Stack.Screen name="ClientPage" component={ClientPage} options={{ title: 'Página del Cliente' }} />;
            case 'En proceso':
                return (
                    <>
                        <Stack.Screen name="RegisterArtesano" component={RegisterArtesano} options={{ title: 'Completa tu Registro' }} />
                        <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ title: 'Establecer una contraseña' }} />
                    </>
                );
            case null:
                // Si aún no se carga el perfil, muestra el spinner.
                return <Stack.Screen name="LoadingRole" component={LoadingScreen} options={{ headerShown: false }} />;
            default:
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

