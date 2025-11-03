// En: app/(app)/ArtPage.js -> Archivo de la página del artesano (Frontend)
// Este archivo es el encargado de mostrar la página del artesano en la aplicación.
// Muestra la página del artesano registrada en la base de datos y permite navegar a la página de inicio, marketplace y ajustes.


// Importaciones
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FeedPage from './FeedPage';
import MarketplacePage from './MarketplacePage';
import ArtesanoSettings from './ArtesanoSettings';
import Estadisticas from './estadisticas';

const Tab = createBottomTabNavigator(); // Crear el tab navigator

// Componente principal
function ArtPage() {
    return (
        // Renderizado
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Feed') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Marketplace') {
                        iconName = focused ? 'store' : 'store-outline';
                    } else if (route.name === 'Estadisticas') {
                        iconName = focused ? 'chart-bar' : 'chart-bar-stacked';
                    } else if (route.name === 'Settings') {
                        iconName = focused ? 'account-circle' : 'account-circle-outline';
                    }

                    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#2575fc',
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
                    fontSize: 12,
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
                name="Estadisticas" 
                component={Estadisticas}
                options={{
                    tabBarLabel: 'Estadísticas',
                }}
            />
            <Tab.Screen 
                name="Settings" 
                component={ArtesanoSettings}
                options={{
                    tabBarLabel: 'Ajustes',
                }}
            />
        </Tab.Navigator>
    );
}

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