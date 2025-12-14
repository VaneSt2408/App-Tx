// En: app/(app)/ClientPage.js
import React from 'react';
import { 
    StyleSheet, 
    SafeAreaView, 
    Text as DefaultText, 
    useWindowDimensions, // <-- Importado para escalado
    Platform             // <-- Importado para lógica condicional
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

const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
);

function ClientPage() {
    const { width: screenWidth } = useWindowDimensions();
    const scaledValue = (size) => Math.round(scale(size, screenWidth));

    // Valores Escalados Reajustados (Base 50 de altura para asegurar espacio para la etiqueta)
    const tabHeight = scaledValue(50); 
    const tabPaddingVertical = scaledValue(5); 
    const labelSize = scaledValue(10); 
    const iconMarginBottom = scaledValue(2); 

    // Renderizado
    return (
        <SafeAreaView style={styles.container}>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    // CORRECCIÓN CLAVE: Asegurar que las etiquetas (nombres) siempre se muestren
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

                        // El tamaño del icono se deja con la variable 'size' de React Navigation, que escala con la fuente.
                        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                    },

                    tabBarActiveTintColor: '#9D046D',
                    tabBarInactiveTintColor: '#666',
                    tabBarStyle: {
                        backgroundColor: '#fff',
                        borderTopWidth: 1,
                        borderTopColor: '#e1e8ed',
                        
                        // --- VALORES ESCALADOS ---
                        height: tabHeight,
                        paddingVertical: tabPaddingVertical, // Usamos paddingVertical
                        // -------------------------
                    },
                    tabBarLabelStyle: {
                        // --- VALOR ESCALADO ---
                        fontSize: labelSize,
                        // ----------------------
                        fontWeight: '500',
                        textAlign: 'center', // Aseguramos que esté centrado
                    },
                    tabBarIconStyle: {
                        marginBottom: iconMarginBottom, // Aseguramos espacio entre icono y texto
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