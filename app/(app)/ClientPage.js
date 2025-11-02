// En: app/(app)/ClientPage.js -> Archivo de la página del cliente (Frontend)
// Este archivo es el encargado de mostrar la página del cliente en la aplicación.
// Muestra la página del cliente registrada en la base de datos y permite navegar a la página de inicio, marketplace y perfil.

// Importaciones
import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FeedPage from './FeedPage';
import MarketplacePage from './MarketplacePage';
import ArtesanoList from './ArtesanoList';
import ClientProfile from './clientProfile';

const Tab = createBottomTabNavigator(); // Crear el tab navigator

// Componente principal
function ClientPage() {
    // Renderizado
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Feed') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Marketplace') {
                        iconName = focused ? 'store' : 'store-outline';
                    } else if (route.name === 'Artesanos') {
                        iconName = focused ? 'account-group' : 'account-group-outline';
                    } else if (route.name === 'Profile') {
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
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
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
                    tabBarLabel: 'Marketplace',
                }}
            />
            <Tab.Screen 
                name="Artesanos" 
                component={ArtesanoList}
                options={{
                    tabBarLabel: 'Artesanos',
                }}
            />
            <Tab.Screen 
                name="Profile" 
                component={ClientProfile}
                options={{
                    tabBarLabel: 'Perfil',
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
});

export default ClientPage;