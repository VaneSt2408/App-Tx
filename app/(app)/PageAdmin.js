// En: app/(app)/PageAdmin.js -> Archivo de la página de administración (Frontend)
import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text as DefaultText, 
    StyleSheet, 
    ActivityIndicator, 
    TouchableOpacity, 
    SafeAreaView, 
    StatusBar,
    useWindowDimensions, // <-- Importado para escalado
    Platform             // <-- Importado para lógica condicional
} from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from '../../src/services/authService'; 
import { supabase } from '../../src/supabase/client'; 
import { Ionicons } from '@expo/vector-icons';
import useCustomFonts from '../../hooks/useFonts';

// Ancho de referencia (iPhone 8/X)
const REFERENCE_WIDTH = 375; 
const scale = (size, screenWidth) => (screenWidth / REFERENCE_WIDTH) * size;

const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
);

function PageAdmin() {
    const { width: screenWidth } = useWindowDimensions(); // Obtenemos el ancho
    const scaledValue = (size) => Math.round(scale(size, screenWidth)); // Función de escalado

    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // ***********************************************
    // AÑADIDO: CONSOLE LOGS PARA VERIFICAR EL ESCALADO
    // ***********************************************
    console.log(`--- Dimensiones y Escalado (PageAdmin) ---`);
    console.log(`Ancho detectado (DIPs): ${screenWidth}`);
    console.log(`Tamaño Título (base 34): ${scaledValue(34)}`);
    console.log(`Padding Botón (base 15): ${scaledValue(15)}`);
    console.log(`Factor de Escalado: ${screenWidth / REFERENCE_WIDTH}`);
    console.log(`------------------------------------------`);

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

    // Estilos Dinámicos (Definidos aquí para usar scaledValue)
    const dynamicStyles = StyleSheet.create({
        header: {
            paddingHorizontal: scaledValue(20),
            paddingVertical: scaledValue(15),
            marginTop: scaledValue(10),
        },
        headerTitle: {
            fontSize: scaledValue(34),
        },
        headerSubtitle: {
            fontSize: scaledValue(17),
        },
        menuContainer: {
            paddingHorizontal: scaledValue(15),
            marginTop: scaledValue(20),
        },
        menuButton: {
            paddingVertical: scaledValue(15),
            paddingHorizontal: scaledValue(15),
            borderRadius: scaledValue(6),
            marginBottom: scaledValue(15),
        },
        iconContainer: {
            width: scaledValue(30), 
            height: scaledValue(30), 
            borderRadius: scaledValue(6),
            marginRight: scaledValue(15),
        },
        menuText: {
            fontSize: scaledValue(17),
        },
        logoutButton: {
            marginHorizontal: scaledValue(15),
            paddingVertical: scaledValue(18),
            borderRadius: scaledValue(9),
            marginBottom: scaledValue(20),
        },
        logoutButtonText: {
            fontSize: scaledValue(17),
            marginLeft: scaledValue(10),
        },
    });

    if (loading || !user) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#9D046D" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* CORRECCIÓN DE BARRA DE ESTADO UNIVERSAL */}
            <StatusBar 
                barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'} 
                backgroundColor={Platform.OS === 'android' ? '#000000' : 'transparent'} 
            />
            
            {/* Header con estilos escalados */}
            <View style={[styles.header, dynamicStyles.header]}>
                <View>
                    <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Panel</Text>
                    <Text style={[styles.headerSubtitle, dynamicStyles.headerSubtitle]}>Administrador</Text>
                </View>
                <Ionicons name="shield-outline" size={scaledValue(28)} color="#000" />
            </View>

            {/* Contenedor de botones del menú */}
            <View style={[styles.menuContainer, dynamicStyles.menuContainer]}>
                
                {/* Botón 1 */}
                <TouchableOpacity 
                    style={[styles.menuButton, styles.menuButtonPurple, dynamicStyles.menuButton]} 
                    onPress={() => router.push('./MagicLink')}
                >
                    <View style={[styles.iconContainer, styles.iconBgBlue, dynamicStyles.iconContainer]}>
                        <Ionicons name="person-add-outline" size={scaledValue(18)} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.menuText, dynamicStyles.menuText]}>Registrar Nuevo Artesano</Text>
                    <Ionicons name="chevron-forward-outline" size={scaledValue(22)} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Botón 2 */}
                <TouchableOpacity 
                    style={[styles.menuButton, styles.menuButtonMagenta, dynamicStyles.menuButton]} 
                    onPress={() => router.push('./ArtesanoList')}
                >
                    <View style={[styles.iconContainer, styles.iconBgGreen, dynamicStyles.iconContainer]}>
                        <Ionicons name="list-outline" size={scaledValue(18)} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.menuText, dynamicStyles.menuText]}>Lista de Artesanos</Text>
                    <Ionicons name="chevron-forward-outline" size={scaledValue(22)} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Botón 3 */}
                <TouchableOpacity 
                    style={[styles.menuButton, styles.menuButtonMagenta, dynamicStyles.menuButton]} 
                    onPress={() => router.push('./estadisticas')}
                >
                    <View style={[styles.iconContainer, styles.iconBgPurple, dynamicStyles.iconContainer]}>
                        <Ionicons name="bar-chart-outline" size={scaledValue(18)} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.menuText, dynamicStyles.menuText]}>Estadísticas</Text>
                    <Ionicons name="chevron-forward-outline" size={scaledValue(22)} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Botón 4 */}
                <TouchableOpacity 
                    style={[styles.menuButton, styles.menuButtonMagenta, dynamicStyles.menuButton]} 
                    onPress={() => router.push('./Eventos')}
                >
                    <View style={[styles.iconContainer, styles.iconBgOrange, dynamicStyles.iconContainer]}>
                        <Ionicons name="calendar-outline" size={scaledValue(18)} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.menuText, dynamicStyles.menuText]}>Eventos</Text>
                    <Ionicons name="chevron-forward-outline" size={scaledValue(22)} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Botón de Cerrar Sesión con estilos escalados */}
            <TouchableOpacity style={[styles.logoutButton, dynamicStyles.logoutButton]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={scaledValue(22)} color="#FFFFFF" />
                <Text style={[styles.logoutButtonText, dynamicStyles.logoutButtonText]}>Cerrar Sesión</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

// Stylesheet estático (solo colores, flexbox y estilos que no deben cambiar)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', 
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontWeight: 'bold',
        color: '#333333', 
    },
    headerSubtitle: {
        color: '#555555', 
    },
    menuContainer: {
        flex: 1, 
    },
    menuButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuButtonPurple: {
        backgroundColor: 'rgba(157, 4, 109, 0.7)', 
    },
    menuButtonMagenta: {
        backgroundColor: 'rgba(157, 4, 109, 0.7)',
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBgBlue: { backgroundColor: '#3B82F6' },
    iconBgGreen: { backgroundColor: '#22C55E' },
    iconBgPurple: { backgroundColor: '#A855F7' },
    iconBgOrange: { backgroundColor: '#F97316' },
    menuText: {
        flex: 1, 
        color: '#FFFFFF',
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(219, 68, 55)', 
    },
    logoutButtonText: {
        color: '#FFFFFF', 
        fontWeight: '600',
    },
});

export default PageAdmin;