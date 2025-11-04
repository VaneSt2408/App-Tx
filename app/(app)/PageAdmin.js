// En: app/(app)/PageAdmin.js
// Este archivo es el encargado de mostrar la página de administración en la aplicación.

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from '../../src/services/authService';
import { supabase } from '../../src/supabase/client';
// Importamos todos los iconos necesarios
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';

function PageAdmin() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        await signOut();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9D046D" />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.mainContent}>
                
                {/* 1. El escudo */}
                <MaterialCommunityIcons name="shield-outline" size={60} color="#333" style={styles.logo} />

                <Text style={styles.title}>Panel de Administrador</Text>

                {/* 2. Los iconos en los botones */}
                
                {/* Botón 1 (COLOR CORREGIDO) */}
                <TouchableOpacity 
                    // Esta es la línea que cambié: ahora usa '#9D046D'
                    style={[styles.mainButton, { backgroundColor: '#9D046D' }]} 
                    onPress={() => router.push('./MagicLink')}
                >
                    <Feather name="user-plus" size={22} color="white" style={styles.buttonIcon} />
                    <Text style={styles.mainButtonText}>Registrar Nuevo Artesano</Text>
                </TouchableOpacity>

                {/* Botón 2 (Mismo color) */}
                <TouchableOpacity 
                    style={[styles.mainButton, { backgroundColor: '#9D046D' }]} 
                    onPress={() => router.push('./ArtesanoList')}
                >
                    <Ionicons name="list" size={24} color="white" style={styles.buttonIcon} />
                    <Text style={styles.mainButtonText}>Lista de artesanos</Text>
                </TouchableOpacity>

                {/* Botón 3 (Mismo color) */}
                <TouchableOpacity 
                    style={[styles.mainButton, { backgroundColor: '#9D046D' }]} 
                    onPress={() => console.log('Estadísticas')}
                >
                    <Ionicons name="stats-chart-outline" size={22} color="white" style={styles.buttonIcon} />
                    <Text style={styles.mainButtonText}>Estadisticas</Text>
                </TouchableOpacity>
            </View>

            {/* Botón de Cerrar Sesión (Mismo color) */}
            <TouchableOpacity 
                style={[styles.mainButton, { backgroundColor: '#9D046D', marginTop: 30 }]} 
                onPress={handleLogout}
            >
                <MaterialCommunityIcons name="logout" size={22} color="white" style={styles.buttonIcon} />
                <Text style={styles.mainButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>

        </ScrollView>
    );
}

// --- HOJA DE ESTILOS (Fondo claro + iconos) ---
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FDF5F2', // Fondo claro
    },
    container: {
        flexGrow: 1,
        backgroundColor: '#FDF5F2', // Fondo claro
        padding: 25,
        justifyContent: 'space-between', 
    },
    mainContent: {
        width: '100%',
        alignItems: 'center', 
    },
    logo: {
        marginBottom: 20, // Espacio entre el escudo y el título
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 40,
    },
    mainButton: {
        flexDirection: 'row', 
        paddingVertical: 18,
        borderRadius: 30, 
        alignItems: 'center',
        justifyContent: 'center', 
        width: '100%', 
        marginBottom: 20, 
    },
    buttonIcon: {
        marginRight: 10, 
    },
    mainButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default PageAdmin;