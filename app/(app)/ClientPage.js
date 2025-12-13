// En: app/(app)/ClientPage.js
import React from 'react';
import { 
    StyleSheet, 
    SafeAreaView, 
    useWindowDimensions, 
    Platform 
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FeedPage from './FeedPage';
import MarketplacePage from './MarketplacePage';
import ArtesanoList from './ArtesanoList';
import ClientSettings from './ClientSettings';
import Estadisticas from './estadisticas';

const Tab = createBottomTabNavigator();

// Ancho de referencia (iPhone 8/X)
const REFERENCE_WIDTH = 375;
const scale = (size, screenWidth) => (screenWidth / REFERENCE_WIDTH) * size;

function ClientPage() {
    const { width: screenWidth } = useWindowDimensions();
    const scaledValue = (size) => Math.round(scale(size, screenWidth));

    // Valores Escalados Reajustados (más padding para la etiqueta)
    const tabHeight = scaledValue(50); // Aumentamos ligeramente la base a 50
    const tabPaddingVertical = scaledValue(5); // Padding arriba/abajo para el contenedor
    const iconMarginBottom = scaledValue(2); // Espacio entre icono y texto
    const labelSize = scaledValue(10); // Reducimos ligeramente la fuente a 10 (mínimo seguro)

    return (
        <SafeAreaView style={styles.container}>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    // 1. CORRECCIÓN CLAVE: Forzar la visibilidad de la etiqueta
                    tabBarShowLabel: true, 
                    
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;
                        if (route.name === 'Feed') {
                            iconName = focused ? 'home' : 'home-outline';
                        } else if (route.name === 'Marketplace') {
                            iconName = focused ? 'store' : 'store-outline';
                        } else if (route.name === 'Artesanos') {
                            iconName = focused ? 'account-group' : 'account-group-outline';
                        } else if (route.name === 'Estadisticas') {
                            iconName = focused ? 'chart-bar' : 'chart-bar-stacked';
                        } else if (route.name === 'Profile') {
                            iconName = focused ? 'account-circle' : 'account-circle-outline';
                        }

                        // El tamaño del icono se deja con la variable 'size' de React Navigation
                        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                    },

                    tabBarActiveTintColor: '#9D046D',
                    tabBarInactiveTintColor: '#666',
                    tabBarStyle: {
                        backgroundColor: '#fff',
                        borderTopWidth: 1,
                        borderTopColor: '#e1e8ed',
                        
                        // --- VALORES ESCALADOS REAJUSTADOS ---
                        height: tabHeight, // Altura escalada
                        paddingVertical: tabPaddingVertical, // Usamos paddingVertical
                        // ------------------------------------
                    },
                    tabBarLabelStyle: {
                        // --- VALOR ESCALADO ---
                        fontSize: labelSize, // Fuente escalada
                        // ----------------------
                        fontWeight: '500',
                        // Aseguramos que el texto esté centrado
                        textAlign: 'center',
                    },
                    // Aseguramos que el icono esté cerca del texto
                    tabBarIconStyle: {
                        marginBottom: iconMarginBottom,
                    },
                    headerShown: false,
                })}
            >
                <Tab.Screen 
                    name="Feed" 
                    component={FeedPage}
                    options={{ tabBarLabel: 'Inicio' }}
                />
                <Tab.Screen 
                    name="Marketplace" 
                    component={MarketplacePage}
                    options={{ tabBarLabel: 'Marketplace' }}
                />
                <Tab.Screen 
                    name="Artesanos" 
                    component={ArtesanoList}
                    options={{ tabBarLabel: 'Artesanos' }}
                />
                <Tab.Screen 
                    name="Estadisticas" 
                    component={Estadisticas}
                    options={{ tabBarLabel: 'Estadísticas' }}
                />
                <Tab.Screen 
                    name="Profile" 
                    component={ClientSettings}
                    options={{ tabBarLabel: 'Perfil' }}
                />
            </Tab.Navigator>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', 
    },
});

export default ClientPage;