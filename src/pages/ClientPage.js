// En: src/pages/ClientPage.js

import React, { useEffect, useState } from 'react'; // Similar a ArtPage.js
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'; // Similar a ArtPage.js
import { signOut } from '../services/authService'; // Similar a ArtPage.js
import { supabase } from '../supabase/client'; // Similar a ArtPage.js
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Similar a ArtPage.js

function ClientPage() { // Asegúrate de que el nombre del componente coincida con el del archivo
    const [user, setUser] = useState(null); // Estado para almacenar los datos del usuario
    const [loading, setLoading] = useState(true); // Estado para manejar la carga

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
            {/* El componente Home con la lista de tareas podría ir aquí si es para clientes */}
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
});

export default ClientPage;