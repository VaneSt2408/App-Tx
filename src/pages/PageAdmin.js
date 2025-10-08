import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signOut } from '../services/authService';
import { supabase } from '../supabase/client';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function PageAdmin() {
    const navigation = useNavigation();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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
        // No se navega aquí. App.js se encarga de todo.
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
            <Text style={styles.title}>Modo: Administrador</Text>
            <TouchableOpacity style={styles.botonPersonalizado} onPress={() => navigation.navigate('RegisterArtesano')}>
                <Text style={styles.textoDelBoton}>Registrar Nuevo Artesano</Text>
            </TouchableOpacity>
        </View>
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
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
        textAlign: 'center',
    },
    userInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        marginBottom: 10,
    },
    emailText: {
        fontSize: 16,
        color: '#555',
    },
    formContainer: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
        userInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // Esto es importante para alinear el ícono
        // ...
    },
    logoutButton: {
        padding: 8, // Añade un poco de espacio para que sea más fácil de presionar
    },
    // Estilos para el contenedor del botón
  botonPersonalizado: {
    backgroundColor: '#177eaaff', // Color de fondo
    paddingVertical: 10,       // Relleno vertical
    paddingHorizontal: 20,   // Relleno horizontal
    borderRadius: 8,           // Bordes redondeados
    borderWidth: 2,            // Ancho del borde
    borderColor: '#177eaaff',    // Color del borde

    // Para centrar el texto (opcional)
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Estilos para el texto dentro del botón
  textoDelBoton: {
    color: 'white',            // Color del texto
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default PageAdmin