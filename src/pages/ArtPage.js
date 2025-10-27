// En: src/pages/ArtPage.js
import React, { useEffect, useState } from 'react'; // Similar a ClientPage.js
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'; // Similar a ClientPage.js
import { signOut } from '../services/authService'; // Similar a ClientPage.js
import { supabase } from '../supabase/client'; // Similar a ClientPage.js
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Similar a ClientPage.js
import { MaterialIcons } from '@expo/vector-icons'; // Para el ícono de agregar
import { useNavigation } from '@react-navigation/native';
import UploadProductModal from '../components/UploadProductModal'; // Modal para subir productos

function ArtPage() {
    const navigation = useNavigation();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // ✅ Función para navegar a crear publicación
    const irACrearPublicacion = () => {
        navigation.navigate('CreatePost');
    };

    const handleUploadProduct = () => { // Función para mostrar el modal de subir producto
        setShowUploadModal(true);
    };

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
    };

    if (loading || !user) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2575fc" />
            </View>
        );
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

            {/* ✅ Botón para crear publicación */}
            <TouchableOpacity
                style={styles.botonCrear}
                onPress={irACrearPublicacion}
            >
                <Text style={styles.botonCrearText}>+ Crear Publicación</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.botonCrear}
                onPress={handleUploadProduct}
            >
                <Text style={styles.botonCrearText}>+ Subir producto</Text>
            </TouchableOpacity>

            {/* Modal para subir productos */}
            <UploadProductModal
                visible={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onProductUploaded={() => {
                    setShowUploadModal(false);
                    // Opcional: recargar productos aquí
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    container: { 
        flex: 1, 
        padding: 20, 
        backgroundColor: '#f5f5f5' 
    },
    title: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        marginBottom: 20, 
        textAlign: 'center' 
    },
    userInfo: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingVertical: 10, 
        borderBottomWidth: 1, 
        borderBottomColor: '#ddd', 
        marginBottom: 20 
    },
    emailText: { 
        fontSize: 16, 
        color: '#555' 
    },
    logoutButton: { 
        padding: 8 
    },
    botonCrear: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    botonCrearText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ArtPage;