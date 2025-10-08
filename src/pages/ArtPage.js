// En: src/pages/ArtPage.js

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { signOut } from '../services/authService';
import { supabase } from '../supabase/client';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function ArtPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // useEffect ahora solo obtiene los datos del usuario para mostrarlos
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
        // App.js se encarga de la redirección
    };

    if (loading || !user) {
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
            <Text style={styles.title}>Modo: Artesano</Text>
            {/* Aquí puedes agregar el contenido específico para el artesano */}
        </View>
    );
}

// ... (tus estilos aquí no cambian, solo asegúrate de no tener duplicados)
const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    userInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ddd', marginBottom: 20 },
    emailText: { fontSize: 16, color: '#555' },
    logoutButton: { padding: 8 },
});

export default ArtPage;