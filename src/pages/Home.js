// En: src/pages/Home.js

import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { TaskContextProvider } from '../context/TaskContext';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import { supabase } from '../supabase/client';

function Home() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function getUserData() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        }
        getUserData();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (loading || !user) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2575fc" /></View>
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