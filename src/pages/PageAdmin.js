//Fontend
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { onAuthStateChange, signOut, getSession } from '../services/authService';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function PageAdmin() {
    const navigation = useNavigation();
    const [user, setUser] = useState(null);
    const [sessionLoaded, setSessionLoaded] = useState(false);

    const navigateToLogin = useCallback(() => {
        navigation.replace('Login');
    }, [navigation]);


    useEffect(() => {

        getSession().then(({ session }) => {
            if (session) {
                setUser(session.user);
            }
            setSessionLoaded(true); 
        });
        const authListener = onAuthStateChange((_event, session) => {
            setUser(session ? session.user : null);
            if (_event === 'SIGNED_OUT') {
                navigateToLogin();
            }
        });

        return () => {
            authListener?.subscription?.unsubscribe();
        };
    }, [navigateToLogin]);

    const handleLogout = async () => {
        const { error } = await signOut();
        if (error) {
            console.error("Error al cerrar sesión:", error.message);
        }
    };
    
    const userKey = user ? user.id : 'loading';

    if (!sessionLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2575fc" />
                <Text style={{ marginTop: 10 }}>Iniciando sesión...</Text>
            </View>
        );
    }

    if (!user) {
        // Esto solo debería ocurrir si la sesión inicial es nula, 
        // en cuyo caso el listener de App.js ya nos debería haber enviado a Login.
        // O si el usuario cierra sesión.
        return null;
    }

    return (
            <View style={styles.container}>
                <Text style={styles.emailText}>Email: {user.email}</Text>
                <View style={styles.userInfo}>
                    <Text style={styles.title}>Modo: Administrador</Text>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <MaterialCommunityIcons name="logout" size={28} color="#db4437" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.botonPersonalizado} onPress={() => navigation.navigate('RegisterArtesano')}>
                {}
                <Text style={styles.textoDelBoton}>Registro de artesanos</Text>
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