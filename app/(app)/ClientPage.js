// En: src/pages/ClientPage.js

import React, { useEffect, useState } from 'react'; // Similar a ArtPage.js
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'; // Similar a ArtPage.js
import { signOut } from '../../src/services/authService'; // Similar to ClientPage.js
import { supabase } from '../../src/supabase/client'; // Similar to ClientPage.js
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Similar to ArtPage.js
import { useRouter } from 'expo-router'; // Importar useRouter para navegación

function ClientPage() { // Asegúrate de que el nombre del componente coincida con el del archivo
    const [user, setUser] = useState(null); // Estado para almacenar los datos del usuario
    const [loading, setLoading] = useState(true); // Estado para manejar la carga
    const router = useRouter(); // Hook para navegación en Expo Router

    useEffect(() => {
        const fetchUser = async () => { // Función para obtener los datos del usuario
            const { data: { user } } = await supabase.auth.getUser(); // Obtiene el usuario actual
            setUser(user); // Actualiza el estado del usuario
            setLoading(false); // Actualiza el estado de carga
        };
        fetchUser(); // Llama a la función para obtener los datos del usuario
    }, []);

    const handleLogout = async () => { // Función para manejar el cierre de sesión
        await signOut(); // Llama a la función signOut
        // App.js se encarga de la redirección
    };

    // Función para navegar a la lista de artesanos
    const handleNavigateToArtesanos = () => {
        router.push('./ArtesanoList');
    };

    if (loading || !user) { // Muestra un indicador de carga mientras se obtienen los datos del usuario
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2575fc" /></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.userInfo}>
                <Text style={styles.emailText}>Email: {user.email}</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <MaterialCommunityIcons name="logout" size={28} color="#db4437" />
                </TouchableOpacity>
            </View>
            <Text style={styles.title}>Modo: Cliente</Text>
            
            <TouchableOpacity style={styles.uploadButton} onPress={() => router.push('/clientProfile')}>
                <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                <Text style={styles.uploadButtonText}>Ver perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.artesanosButton} onPress={handleNavigateToArtesanos}>
                <MaterialCommunityIcons name="account-group" size={24} color="#fff" />
                <Text style={styles.artesanosButtonText}>Lista de Artesanos</Text>
            </TouchableOpacity>

        </View>
    );
}

// ... (tus estilos aquí)
const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    userInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ddd', marginBottom: 20 },
    emailText: { fontSize: 16, color: '#555' },
    logoutButton: { padding: 8 },
    uploadButton: {
        backgroundColor: '#2575fc',
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
    artesanosButton: {
        backgroundColor: '#8a17aaff',
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
    artesanosButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default ClientPage;