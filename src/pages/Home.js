import React, { useEffect, useState } from 'react'; // En: src/pages/Home.js
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native'; // En: src/pages/Home.js
import { TaskContextProvider } from '../context/TaskContext'; // En: src/pages/Home.js
import TaskForm from '../components/TaskForm'; // En: src/pages/Home.js
import TaskList from '../components/TaskList'; // En: src/pages/Home.js
import { signOut } from '../services/authService'; // En: src/pages/Home.js
import { supabase } from '../supabase/client'; // En: src/pages/Home.js

function Home() {
    const [user, setUser] = useState(null); // En: src/pages/Home.js
    const [loading, setLoading] = useState(true); // En: src/pages/Home.js
    // useEffect ahora solo obtiene los datos del usuario para mostrarlos
    
    useEffect(() => { // Similar al de ClientPage.js pero sin lógica de tareas
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
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2575fc" /></View>;
    }

    return (
        <TaskContextProvider key={user.id}>
            <View style={styles.container}>
                <Text style={styles.title}>Lista de Tareas</Text>
                <View style={styles.userInfo}>
                    <Text style={styles.emailText}>Email: {user.email}</Text>
                    <Button title="Cerrar Sesión" onPress={handleLogout} color="#db4437" />
                </View>
                <TaskForm />
                <TaskList />
            </View>
        </TaskContextProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333', textAlign: 'center' },
    userInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ddd', marginBottom: 10 },
    emailText: { fontSize: 16, color: '#555' },
});

export default Home;