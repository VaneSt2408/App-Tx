// En: app/(app)/PageAdmin.js
import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text as DefaultText, 
    StyleSheet, 
    ActivityIndicator, 
    TouchableOpacity, 
    SafeAreaView, 
    StatusBar, 
    Platform,
    useWindowDimensions // <-- Hook para dimensiones dinámicas
} from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from '../../src/services/authService';
import { supabase } from '../../src/supabase/client';
import { Ionicons } from '@expo/vector-icons';
import useCustomFonts from '../../hooks/useFonts';

// Ancho de referencia (iPhone 8/X)
const REFERENCE_WIDTH = 375; 

// Función para escalar valores basada en el ancho de la pantalla
const scale = (size, screenWidth) => (screenWidth / REFERENCE_WIDTH) * size;

const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
);

function PageAdmin() {
    const { width: screenWidth } = useWindowDimensions(); // <-- Obtenemos el ancho
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Función para escalar el tamaño de fuente y asegurar que sea entero
    const scaledText = (size) => Math.round(scale(size, screenWidth));
    
    // ***********************************************
    // AÑADIDO: CONSOLE LOGS PARA VERIFICAR EL ESCALADO
    // ***********************************************
    
    console.log(`--- Dimensiones y Escalado ---`);
    console.log(`Ancho detectado (DIPs): ${screenWidth}`);
    
    // Ejemplos clave de cómo se escalan los valores
    const scaledHeaderTitle = scaledText(34);
    const scaledButtonPadding = scaledText(15);
    
    console.log(`Tamaño de Título (base 34): ${scaledHeaderTitle}`);
    console.log(`Padding de Botón (base 15): ${scaledButtonPadding}`);
    console.log(`Factor de Escalado (Ancho/${REFERENCE_WIDTH}): ${screenWidth / REFERENCE_WIDTH}`);
    console.log(`-----------------------------------`);

    // Lógica de usuario y logout (sin cambios)
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        await signOut();
    };

    if (loading || !user) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#9D046D" />
            </View>
        );
    }

    // Usamos un StyleSheet dinámico para aplicar el escalado de dimensiones
    const dynamicStyles = StyleSheet.create({
        // Adaptamos el padding horizontal del header
        header: {
            paddingHorizontal: scaledText(20), // Escalado
            paddingVertical: scaledText(15), // Escalado
            marginTop: scaledText(10),
        },
        headerTitle: {
            fontSize: scaledText(34), // Escalamos el tamaño de fuente
        },
        headerSubtitle: {
            fontSize: scaledText(17), // Escalamos el tamaño de fuente
        },
        menuContainer: {
            paddingHorizontal: scaledText(15), // Escalamos el padding
            marginTop: scaledText(20),
        },
        menuButton: {
            paddingVertical: scaledText(15),
            paddingHorizontal: scaledText(15),
            marginBottom: scaledText(15),
        },
        menuText: {
            fontSize: scaledText(17),
        },
        iconContainer: {
            width: scaledText(30), 
            height: scaledText(30), 
        },
        logoutButton: {
            marginHorizontal: scaledText(15),
            paddingVertical: scaledText(18),
            marginBottom: scaledText(20),
        },
        logoutButtonText: {
            fontSize: scaledText(17),
            marginLeft: scaledText(10),
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar 
            barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'} // Fondo para IOS
            backgroundColor={Platform.OS === 'android' ? '#000000' : 'transparent'} // Fondo solo para Android
        />
            
            {/* Usamos el estilo dinámico para el Header */}
            <View style={[styles.header, dynamicStyles.header]}>
                <View>
                    <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Panel</Text>
                    <Text style={[styles.headerSubtitle, dynamicStyles.headerSubtitle]}>Administrador</Text>
                </View>
                <Ionicons name="shield-outline" size={scaledText(28)} color="#000" />
            </View>

            {/* Contenedor de botones del menú */}
            <View style={[styles.menuContainer, dynamicStyles.menuContainer]}>
                
                {/* Botón 1 */}
                <TouchableOpacity 
                    style={[styles.menuButton, styles.menuButtonPurple, dynamicStyles.menuButton]} 
                    onPress={() => router.push('./MagicLink')}
                >
                    <View style={[styles.iconContainer, styles.iconBgBlue, styles.menuIcon, dynamicStyles.iconContainer]}>
                        <Ionicons name="person-add-outline" size={scaledText(18)} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.menuText, dynamicStyles.menuText]}>Registrar Nuevo Artesano</Text>
                    <Ionicons name="chevron-forward-outline" size={scaledText(22)} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Botón 2 */}
                <TouchableOpacity 
                    style={[styles.menuButton, styles.menuButtonMagenta, dynamicStyles.menuButton]} 
                    onPress={() => router.push('./ArtesanoList')}
                >
                    <View style={[styles.iconContainer, styles.iconBgGreen, styles.menuIcon, dynamicStyles.iconContainer]}>
                        <Ionicons name="list-outline" size={scaledText(18)} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.menuText, dynamicStyles.menuText]}>Lista de Artesanos</Text>
                    <Ionicons name="chevron-forward-outline" size={scaledText(22)} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Botón 3 */}
                <TouchableOpacity 
                    style={[styles.menuButton, styles.menuButtonMagenta, dynamicStyles.menuButton]} 
                    onPress={() => router.push('./estadisticas')}
                >
                    <View style={[styles.iconContainer, styles.iconBgPurple, styles.menuIcon, dynamicStyles.iconContainer]}>
                        <Ionicons name="bar-chart-outline" size={scaledText(18)} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.menuText, dynamicStyles.menuText]}>Estadísticas</Text>
                    <Ionicons name="chevron-forward-outline" size={scaledText(22)} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Botón 4 */}
                <TouchableOpacity 
                    style={[styles.menuButton, styles.menuButtonMagenta, dynamicStyles.menuButton]} 
                    onPress={() => router.push('./Eventos')}
                >
                    <View style={[styles.iconContainer, styles.iconBgOrange, styles.menuIcon, dynamicStyles.iconContainer]}>
                        <Ionicons name="calendar-outline" size={scaledText(18)} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.menuText, dynamicStyles.menuText]}>Eventos</Text>
                    <Ionicons name="chevron-forward-outline" size={scaledText(22)} color="#FFFFFF" />
                </TouchableOpacity>

            </View>

            {/* Botón de Cerrar Sesión */}
            <TouchableOpacity style={[styles.logoutButton, dynamicStyles.logoutButton]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={scaledText(22)} color="#FFFFFF" />
                <Text style={[styles.logoutButtonText, dynamicStyles.logoutButtonText]}>Cerrar Sesión</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

// Stylesheet estático (sin cambios)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', },
    headerTitle: { fontWeight: 'bold', color: '#333333', },
    headerSubtitle: { color: '#555555', },
    menuContainer: { flex: 1, },
    menuButton: { flexDirection: 'row', alignItems: 'center', borderRadius: 6, },
    menuButtonPurple: { backgroundColor: 'rgba(157, 4, 109, 0.7)', },
    menuButtonMagenta: { backgroundColor: 'rgba(157, 4, 109, 0.7)', },
    menuIcon: { marginRight: 15, },
    iconContainer: { borderRadius: 6, justifyContent: 'center', alignItems: 'center', },
    iconBgBlue: { backgroundColor: '#3B82F6' },
    iconBgGreen: { backgroundColor: '#22C55E' },
    iconBgPurple: { backgroundColor: '#A855F7' },
    iconBgOrange: { backgroundColor: '#F97316' },
    menuText: { flex: 1, color: '#FFFFFF', fontWeight: '500', },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(219, 68, 55)', borderRadius: 9, },
    logoutButtonText: { color: '#FFFFFF', fontWeight: '600', },
});

export default PageAdmin;