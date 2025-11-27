// En: app/(app)/PageAdmin.js -> Archivo de la página de administración (Frontend)
// Este archivo es el encargado de mostrar la página de administración en la aplicación.
// Muestra la página de administración registrada en la base de datos y permite cerrar sesión, navegar a la página de invitación de enlace mágico, lista de artesanos, estadísticas, modificación/eliminación y configuración general.

import React, { useEffect, useState } from 'react';
import { View, Text as DefaultText, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from '../../src/services/authService'; // Asumo que la ruta es correcta
import { supabase } from '../../src/supabase/client'; // Asumo que la ruta es correcta
import { Ionicons } from '@expo/vector-icons'; // Importamos Ionicons para los iconos
import useCustomFonts from '../../hooks/useFonts';

    const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
    );

function PageAdmin() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    

    // useEffect no se toca, la lógica se mantiene
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        fetchUser();
    }, []);

    // handleLogout no se toca, la lógica se mantiene
    const handleLogout = async () => {
        await signOut();
        // No se navega aquí. App.js se encarga de todo.
    };

    if (loading || !user) {
        return (
            // Usamos el color de fondo original #f5ff5
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#9D046D" />
            </View>
        );
    }

    // El JSX se actualiza para coincidir con la imagen pero con los colores originales
    return (
        <SafeAreaView style={styles.container}>
            {/* Cambiamos la barra de estado a oscura para el fondo claro */}
            <StatusBar barStyle="dark-content" />
            
            {/* Header como en la imagen, pero con texto oscuro */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Panel</Text>
                    <Text style={styles.headerSubtitle}>Administrador</Text>
                </View>
                {/* Icono oscuro para fondo claro */}
                <Ionicons name="shield-outline" size={28} color="#000" />
            </View>

            {/* Contenedor de botones del menú */}
            <View style={styles.menuContainer}>
                {/* Botón 1 con color original: #690DB5 e ícono con fondo */}
                <TouchableOpacity 
                    style={[styles.menuButton, styles.menuButtonPurple]} 
                    onPress={() => router.push('./MagicLink')}
                >
                    {/* Contenedor de icono con color */}
                    <View style={[styles.iconContainer, styles.iconBgBlue, styles.menuIcon]}>
                        <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
                    </View>
                    <Text style={styles.menuText}>Registrar Nuevo Artesano</Text>
                    <Ionicons name="chevron-forward-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Botón 2 con color original: #9D046D e ícono con fondo */}
                <TouchableOpacity 
                    style={[styles.menuButton, styles.menuButtonMagenta]} 
                    onPress={() => router.push('./ArtesanoList')}
                >
                    {/* Contenedor de icono con color */}
                    <View style={[styles.iconContainer, styles.iconBgGreen, styles.menuIcon]}>
                        <Ionicons name="list-outline" size={18} color="#FFFFFF" />
                    </View>
                    <Text style={styles.menuText}>Lista de Artesanos</Text>
                    <Ionicons name="chevron-forward-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Botón 3 con color original: #9D046D e ícono con fondo */}
                <TouchableOpacity 
                    style={[styles.menuButton, styles.menuButtonMagenta]} 
                    onPress={() => router.push('./estadisticas')}
                >
                    {/* Contenedor de icono con color */}
                    <View style={[styles.iconContainer, styles.iconBgPurple, styles.menuIcon]}>
                        <Ionicons name="bar-chart-outline" size={18} color="#FFFFFF" />
                    </View>
                    <Text style={styles.menuText}>Estadísticas</Text>
                    <Ionicons name="chevron-forward-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Botón 4 con color original: #9D046D e ícono con fondo */}
                <TouchableOpacity 
                    style={[styles.menuButton, styles.menuButtonMagenta]} 
                    onPress={() => router.push('./Eventos')}
                >
                    {/* Contenedor de icono con color */}
                    <View style={[styles.iconContainer, styles.iconBgOrange, styles.menuIcon]}>
                        <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
                    </View>
                    <Text style={styles.menuText}>Eventos</Text>
                    <Ionicons name="chevron-forward-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Botón de Cerrar Sesión al final, con el color rojo original #db4437 */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
                <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

// Stylesheet actualizado con los colores originales
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', // Color de fondo original
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#333333', // Texto oscuro para fondo claro
    },
    headerSubtitle: {
        fontSize: 17,
        color: '#555555', // Texto oscuro para fondo claro
    },
    menuContainer: {
        flex: 1, 
        paddingHorizontal: 15,
        marginTop: 20,
    },
    // Estilo base para los botones
    menuButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15, // Reducido un poco para que se vea mejor con el icono
        paddingHorizontal: 15,
        borderRadius: 6, // CAMBIO: De 12 a 6 (rounded-sm)
        marginBottom: 15, 
    },
    // Color específico para el primer botón
    menuButtonPurple: {
        // CAMBIO: Se usa rgba para la transparencia (R=157, G=4, B=109, A=0.7)
        backgroundColor: 'rgba(157, 4, 109, 0.7)', 
        // Se quitó opacity: 0.7
    },
    // Color específico para los otros botones
    menuButtonMagenta: {
        // CAMBIO: Se usa rgba para la transparencia (R=157, G=4, B=109, A=0.7)
        backgroundColor: 'rgba(157, 4, 109, 0.7)',
        // Se quitó opacity: 0.7
    },
    
    // --- NUEVOS ESTILOS PARA LOS ICONOS ---
    menuIcon: {
        marginRight: 15, // Mantenemos el margen
    },
    iconContainer: {
        width: 30, // Tamaño del círculo
        height: 30, // Tamaño del círculo
        borderRadius: 6, // CAMBIO: De 15 a 6 (menos round)
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Colores iconos
    iconBgBlue: {
        backgroundColor: '#3B82F6', // Azul
    },
    iconBgGreen: {
        backgroundColor: '#22C55E', // Verde
    },
    iconBgPurple: {
        backgroundColor: '#A855F7', // Morado
    },
    iconBgOrange: {
        backgroundColor: '#F97316', // Naranja
    },
    // --- FIN DE NUEVOS ESTILOS ---

    // Texto blanco para que contraste con los botones de color
    menuText: {
        flex: 1, 
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        // CAMBIO: Se usa rgba para la transparencia (R=219, G=68, B=55, A=0.9)
        backgroundColor: 'rgba(219, 68, 55)', 
        marginHorizontal: 15,
        paddingVertical: 18,
        borderRadius: 9, //CAMBIO: De 12 a 6 (rounded-sm)
        marginBottom: 20, 
        // Se quitó opacity: 0.9
    },
    logoutButtonText: {
        color: '#FFFFFF', // Texto blanco
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 10,
    },
});

export default PageAdmin;