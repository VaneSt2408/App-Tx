import React, { useEffect, useState } from 'react'; // En: src/pages/PageAdmin.js
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'; // Asegúrate de importar TouchableOpacity
import { useRouter } from 'expo-router'; // Importa useRouter para la navegación con Expo Router
import { signOut } from '../../src/services/authService'; // Similar a ClientPage.js
import { supabase } from '../../src/supabase/client'; // Similar a ClientPage.js
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Importa los íconos de MaterialCommunityIcons

function PageAdmin() { // Asegúrate de que el nombre del componente coincida con el del archivo
    const router = useRouter(); // Hook para la navegación con Expo Router
    const [user, setUser] = useState(null); // Estado para almacenar los datos del usuario
    const [loading, setLoading] = useState(true); // Estado para manejar la carga

    // useEffect ahora solo obtiene los datos del usuario para mostrarlos
    useEffect(() => { // Similar al de Home.js pero sin lógica de tareas
        const fetchUser = async () => { // Función para obtener los datos del usuario
            const { data: { user } } = await supabase.auth.getUser(); // Obtiene el usuario actual
            setUser(user); // Actualiza el estado del usuario
            setLoading(false); // Actualiza el estado de carga
        };
        fetchUser(); // Llama a la función para obtener los datos del usuario
    }, []);

    const handleLogout = async () => { // Función para manejar el cierre de sesión
        await signOut(); // Llama a la función signOut
        // No se navega aquí. App.js se encarga de todo.
    };

    if (loading || !user) { // Muestra un indicador de carga mientras se obtienen los datos del usuario
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#9D046D" /></View>;
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
            <TouchableOpacity style={styles.botonPersonalizado} onPress={() => router.push('./MagicLink')}>
                <Text style={styles.textoDelBoton}>Registrar Nuevo Artesano</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botonPersonalizado2} onPress={() => router.push('./ArtesanoList')}>
            <Text style={styles.textoDelBoton}>Lista de artesanos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botonPersonalizado3} onPress={() => router.push('./RegisterArtesano')}>
            <Text style={styles.textoDelBoton}>Estadisticas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botonPersonalizado4} onPress={() => router.push('./RegisterArtesano')}>
            <Text style={styles.textoDelBoton}>Modificar/Eliminar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botonPersonalizado5} onPress={() => router.push('./RegisterArtesano')}>
            <Text style={styles.textoDelBoton}>Configuracion general</Text>
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
    logoutButton: {
        padding: 8, // Añade un poco de espacio para que sea más fácil de presionar
    },
    // Estilos para el contenedor del botón
  botonPersonalizado: {
    backgroundColor: '#690DB5', // Color de fondo
    paddingVertical: 10,       // Relleno vertical
    paddingHorizontal: 20,   // Relleno horizontal
    borderRadius: 8,           // Bordes redondeados
    borderWidth: 2,            // Ancho del borde
    borderColor: '#fff',    // Color del borde
    top: 10, 

    // Para centrar el texto (opcional)
    alignItems: 'center',
    justifyContent: 'center',
  },

    botonPersonalizado2: {
    backgroundColor: '#9D046D', // Color de fondo
    paddingVertical: 10,       // Relleno vertical
    paddingHorizontal: 20,   // Relleno horizontal
    borderRadius: 8,           // Bordes redondeados
    borderWidth: 2,            // Ancho del borde
    borderColor: '#9D046D',    // Color del borde
    top: 20,

    // Para centrar el texto (opcional)
    alignItems: 'center',
    justifyContent: 'center',
  },

    botonPersonalizado3: {
    backgroundColor: '#9D046D', // Color de fondo
    paddingVertical: 10,       // Relleno vertical
    paddingHorizontal: 20,   // Relleno horizontal
    borderRadius: 8,           // Bordes redondeados
    borderWidth: 2,            // Ancho del borde
    borderColor: '#9D046D',    // Color del borde
    top: 30,

    // Para centrar el texto (opcional)
    alignItems: 'center',
    justifyContent: 'center',
  },
    
    botonPersonalizado4: {
    backgroundColor: '#9D046D', // Color de fondo
    paddingVertical: 10,       // Relleno vertical
    paddingHorizontal: 20,   // Relleno horizontal
    borderRadius: 8,           // Bordes redondeados
    borderWidth: 2,            // Ancho del borde
    borderColor: '#9D046D',    // Color del borde
    top: 40,

    // Para centrar el texto (opcional)
    alignItems: 'center',
    justifyContent: 'center',
  },

    botonPersonalizado5: {
    backgroundColor: '#9D046D', // Color de fondo
    paddingVertical: 10,       // Relleno vertical
    paddingHorizontal: 20,   // Relleno horizontal
    borderRadius: 8,           // Bordes redondeados
    borderWidth: 2,            // Ancho del borde
    borderColor: '#9D046D',    // Color del borde
    top: 50,

    // Para centrar el texto (opcional)
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Estilos para el texto dentro del botón (único, reutilizable)
  textoDelBoton: {
    color: 'white',            // Color del texto
    fontSize: 16,
    fontWeight: 'bold',
  }


});

export default PageAdmin