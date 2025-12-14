// En: app/(app)/ArtPage.js -> Archivo de la página del artesano (Frontend)
// Este archivo es el encargado de mostrar la página del artesano en la aplicación.

// Importaciones
import React from 'react';
import { 
    StyleSheet, 
    SafeAreaView, 
    useWindowDimensions, // Para el escalado dinámico
    Platform,            // Para la lógica de la Barra de Estado
    StatusBar,           // Para el control de la Barra de Estado
    Text as DefaultText 
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FeedPage from './FeedPage';
import MarketplacePage from './MarketplacePage';
import ArtesanoSettings from './ArtesanoSettings';
import Estadisticas from './estadisticas';

const Tab = createBottomTabNavigator();
const ProfileStack = createStackNavigator();

// --- LÓGICA DE ESCALADO ---
const REFERENCE_WIDTH = 375;
const scale = (size, screenWidth) => (screenWidth / REFERENCE_WIDTH) * size;

const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
);

// Este es el nuevo navegador para la pestaña de Perfil
function ProfileStackNavigator() {
    return (
        <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
            <ProfileStack.Screen name="ArtesanoSettings" component={ArtesanoSettings} />
        </ProfileStack.Navigator>
    );
}

// Componente principal
function ArtPage() {
    const { width: screenWidth } = useWindowDimensions();
    const scaledValue = (size) => Math.round(scale(size, screenWidth));

    // Valores Escalados para la Tab Bar (Base de 50 de altura)
    const tabHeight = scaledValue(50); 
    const tabPaddingVertical = scaledValue(5); 
    const labelSize = scaledValue(10); 
    const iconMarginBottom = scaledValue(2); 

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            
            {/* CORRECCIÓN DE BARRA DE ESTADO UNIVERSAL (Para Android/iOS) */}
            <StatusBar 
                barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'} 
                backgroundColor={Platform.OS === 'android' ? '#000000' : 'transparent'} 
            />
            
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    // CLAVE: Asegura que la etiqueta (el nombre) siempre se muestre
                    tabBarShowLabel: true, 

                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;

                        if (route.name === 'Feed') {
                            iconName = focused ? 'home' : 'home-outline';
                        } else if (route.name === 'Marketplace') {
                            iconName = focused ? 'store' : 'store-outline';
                        } else if (route.name === 'Estadisticas') {
                            iconName = focused ? 'chart-bar' : 'chart-bar-stacked';
                        } else if (route.name === 'Perfil') {
                            iconName = focused ? 'account-circle' : 'account-circle-outline';
                        }
                        
                        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                    },
                    
                    tabBarActiveTintColor: '#9D046D',
                    tabBarInactiveTintColor: '#666',
                    tabBarStyle: {
                        backgroundColor: '#fff',
                        borderTopWidth: 1,
                        borderTopColor: '#e1e8ed',
                        
                        // --- VALORES ESCALADOS PARA EL CONTENEDOR ---
                        height: tabHeight,
                        paddingVertical: tabPaddingVertical, 
                        // --------------------------------------------
                    },
                    tabBarLabelStyle: {
                        // --- VALOR ESCALADO PARA LA FUENTE ---
                        fontSize: labelSize,
                        // -------------------------------------
                        fontWeight: '500',
                        textAlign: 'center',
                    },
                    tabBarIconStyle: {
                        marginBottom: iconMarginBottom, // Espacio entre icono y texto escalado
                    },
                    headerShown: false,
                })}
            >
                <Tab.Screen 
                    name="Feed" 
                    component={FeedPage}
                    options={{
                        tabBarLabel: 'Inicio',
                    }}
                />
                <Tab.Screen 
                    name="Marketplace" 
                    component={MarketplacePage}
                    options={{
                        tabBarLabel: 'Mercadito',
                    }}
                />
                <Tab.Screen 
                    name="Estadisticas" 
                    component={Estadisticas}
                    options={{
                        tabBarLabel: 'Estadísticas',
                    }}
                />
                <Tab.Screen 
                    name="Perfil" 
                    component={ProfileStackNavigator}
                    options={{
                        tabBarLabel: 'Perfil',
                    }}
                />
            </Tab.Navigator>
        </SafeAreaView>
    );
}

// Stylesheet estático (sin cambios)
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    userInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        marginBottom: 20,
    },
    emailText: {
        fontSize: 16,
        color: '#555',
    },
    logoutButton: {
        padding: 8,
    },
    uploadButton: {
        backgroundColor: '#9D046D',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    uploadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default ArtPage;