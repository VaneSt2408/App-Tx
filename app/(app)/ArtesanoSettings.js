// En: app/(app)/ArtesanoSettings.js -> Nueva pantalla de perfil único con diseño superior mejorado y botón de cerrar sesión
import React, { useState, useEffect } from 'react';
import { View, Text as DefaultText, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, Dimensions, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { artesanoService } from '../../src/services/artesanoService';
import { signOut } from '../../src/services/authService'; // Importar la función de cerrar sesión

const { width } = Dimensions.get('window');

const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
);

export default function ArtesanoSettings() {
    const router = useRouter();
    const { session } = useAuth();
    const [artesano, setArtesano] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.id) {
            loadArtesanoProfile();
        }
    }, [session]);

    const loadArtesanoProfile = async () => {
        try {
            setLoading(true);
            const data = await artesanoService.getArtesanoCompleto(session.user.id);
            setArtesano(data.artesano);
        } catch (error) {
            console.error('Error al cargar perfil:', error);
        } finally {
            setLoading(false);
        }
    };

    // Función para cerrar sesión
    const handleLogout = async () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro de que deseas cerrar sesión?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Cerrar Sesión',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        // Opcional: redirigir a la pantalla de inicio de sesión
                        // router.replace('/(auth)/login'); // Descomenta si deseas redirigir
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Cargando perfil...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!artesano) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Datos simulados para el diseño (reemplaza con los datos reales cuando estén disponibles)
    const seguidores = 1200;
    const publicaciones = 89;
    const valoracion = 4.8;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.contentContainer}>
                {/* Header con foto de perfil, nombre y botones */}
                <View style={[styles.header,{fontFamily: 'Alan Sans'}]}>
                    <View style={styles.avatarContainer}>
                        {artesano.avatar_url ? (
                            <Image source={{ uri: artesano.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.defaultAvatar}>
                                <MaterialCommunityIcons name="account" size={60} color="#666" />
                            </View>
                        )}
                    </View>

                    <Text style={[styles.name,{fontFamily: 'Alan Sans'}]}>{artesano.nombre || 'Sin nombre'}</Text>
                    <Text style={styles.specialty}>{artesano.categoria || 'Ceramista'} - {artesano.ubicacion || 'Madrid, España'}</Text>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.viewAsVisitorButton}>
                            <Text style={[styles.viewAsVisitorText,{fontFamily: 'Alan Sans'}]}>Ver como visitante</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.editProfileButton}
                            onPress={() => router.push(`/ArtesanoProfile?userId=${session.user.id}`)}
                        >
                            <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
                            <Text style={[styles.editProfileText,{fontFamily: 'Alan Sans'}]}>Editar Perfil</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Métricas: Seguidores, Publicaciones, Valoración */}
                    <View style={styles.metricsContainer}>
                        <View style={styles.metricCard}>
                            <Text style={[styles.metricNumber,{fontFamily: 'Alan Sans'}]}>{seguidores.toLocaleString()}</Text>
                            <Text style={[styles.metricLabel,{fontFamily: 'Alan Sans'}]}>Seguidores</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={[styles.metricNumber,{fontFamily: 'Alan Sans'}]}>{publicaciones}</Text>
                            <Text style={[styles.metricLabel,{fontFamily: 'Alan Sans'}]}>Publicaciones</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={[styles.metricNumber,{fontFamily: 'Alan Sans'}]}>{valoracion}</Text>
                            <Text style={[styles.metricLabel,{fontFamily: 'Alan Sans'}]}>Valoración ⭐</Text>
                        </View>
                    </View>
                </View>

                {/* Pestañas: Sobre mí, Mi Trabajo, Reseñas */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                        <Text style={[styles.tabText, styles.activeTabText,{fontFamily: 'Alan Sans'}]}>Sobre mí</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.tab}>
                        <Text style={[styles.tabText,{fontFamily: 'Alan Sans'}]}>Mi Trabajo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.tab}>
                        <Text style={[styles.tabText,{fontFamily: 'Alan Sans'}]}>Reseñas</Text>
                    </TouchableOpacity>
                </View>

                {/* Contenido de ejemplo para cada pestaña */}
                <View style={styles.tabContent}>
                    <Text style={[styles.tabContentText,{fontFamily: 'Alan Sans'}]}>
                        Esta es la sección Sobre mí. Aquí puedes mostrar información personal, historia, inspiración, etc.
                    </Text>
                </View>

                {/* Botón de Cerrar Sesión */}
                <View style={styles.logoutSection}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <MaterialCommunityIcons name="logout" size={24} color="#fff" />
                        <Text style={[styles.logoutButtonText, { fontFamily: 'Alan Sans' }]}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        paddingBottom: 20,
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    avatarContainer: {
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#fff',
        backgroundColor: '#f0f0f0',
    },
    defaultAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
    },
    specialty: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    viewAsVisitorButton: {
        backgroundColor: '#f5f5f5',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    viewAsVisitorText: {
        fontSize: 14,
        color: '#333',
    },
    editProfileButton: {
        backgroundColor: '#9D046D',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    editProfileText: {
        fontSize: 14,
        color: '#fff',
        marginLeft: 5,
    },
    metricsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    metricCard: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    metricNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    metricLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#9D046D',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
    },
    activeTabText: {
        color: '#9D046D',
        fontWeight: 'bold',
    },
    tabContent: {
        padding: 20,
    },
    tabContentText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    logoutSection: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#db4437',
        paddingVertical: 16,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
    },
});