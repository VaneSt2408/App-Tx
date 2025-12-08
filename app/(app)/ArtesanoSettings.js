// En: app/(app)/ArtesanoSettings.js -> Nueva pantalla de perfil único con diseño superior mejorado y botón de cerrar sesión
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text as DefaultText, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, Dimensions, Alert, RefreshControl, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useCustomFonts from '../../hooks/useFonts';
import { useAuth } from '../../src/context/AuthContext';
import { artesanoService } from '../../src/services/artesanoService';

const { width } = Dimensions.get('window');

const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
);

export default function ArtesanoSettings() {
    const router = useRouter();
    const { session } = useAuth();
    const [artesano, setArtesano] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); // 1. Añadir estado para el refresco
    const [activeTab, setActiveTab] = useState('sobreMi'); // Estado para la pestaña activa
    const [publicaciones, setPublicaciones] = useState([]); // Estado para las publicaciones del artesano
    const [productos, setProductos] = useState([]); // Estado para los productos del artesano

    useEffect(() => {
        if (session?.user?.id) {
            loadArtesanoProfile(true); // Carga inicial
        }
    }, [session]);

    const loadArtesanoProfile = async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) setLoading(true);
            const data = await artesanoService.getArtesanoCompleto(session.user.id);
            setArtesano(data.artesano);
            setPublicaciones(data.publicaciones || []);
            setProductos(data.productos || []); // Cargar los productos
        } catch (error) {
            console.error('Error al cargar perfil:', error);
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    };

    // 2. Crear la función onRefresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await loadArtesanoProfile();
        } finally {
            setRefreshing(false);
        }
    }, []);

    // *** Se mantiene la función para abrir el enlace de Google Maps ***
    const handleOpenMaps = async (url) => {
        if (!url) return;
        // Verificar si el enlace es soportado
        const supported = await Linking.canOpenURL(url);
        if (supported) {
        await Linking.openURL(url);
        } else {
        Alert.alert('Error', 'No se puede abrir este enlace');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText,{fontFamily: 'Alan Sans'}]}>Cargando perfil...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!artesano) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText,{fontFamily: 'Alan Sans'}]}>No se pudo cargar el perfil</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.contentContainer}
                // 3. Añadir el RefreshControl al ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#9D046D']} // Color del indicador de carga
                    />
                }
            >
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
                    <Text style={[styles.specialty,{fontFamily: 'Alan Sans'}]}>{artesano.categoria || 'Ceramista'}</Text>

                    {/* Bloque de Ubicación con enlace a Google Maps */}
                    {artesano?.link_ubicacion && artesano?.ubicacion && (
                        <TouchableOpacity 
                            style={styles.infoRow} 
                            onPress={() => handleOpenMaps(artesano.link_ubicacion)}>
                            <MaterialCommunityIcons name="map-marker-outline" size={16} color="#FD2D1C" />
                            <Text style={[styles.infoText, styles.linkText, {fontFamily: 'Alan Sans'}]}>{artesano.ubicacion}</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.buttonRow}>
                        <TouchableOpacity 
                            style={styles.viewAsVisitorButton}
                            onPress={() => router.push(`/ArtesanoProfileVistaVisitante?userId=${session.user.id}&email=${session.user.email}`)}
                        >
                            <Text style={[styles.viewAsVisitorText,{fontFamily: 'Alan Sans'}]}>Ver como visitante</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.editProfileButton}
                            onPress={() => router.push({ pathname: 'AjustesPerfilArtesano', params: { userId: session.user.id } })}
                        >
                            <MaterialCommunityIcons name="cog" size={16} color="#fff" />
                            <Text style={[styles.editProfileText,{fontFamily: 'Alan Sans'}]}>Ajustes</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Métricas: Seguidores, Publicaciones, Valoración */}
                    <View style={styles.metricsContainer}>
                        <View style={styles.metricCard}>
                            <Text style={[styles.metricNumber,{fontFamily: 'Alan Sans'}]}>{productos.length}</Text>
                            <Text style={[styles.metricLabel,{fontFamily: 'Alan Sans'}]}>Productos</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={[styles.metricNumber,{fontFamily: 'Alan Sans'}]}>{publicaciones.length}</Text>
                            <Text style={[styles.metricLabel,{fontFamily: 'Alan Sans'}]}>Publicaciones</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={[styles.metricNumber,{fontFamily: 'Alan Sans'}]}>{artesano?.total_likes || 0}</Text>
                            <Text style={[styles.metricLabel,{fontFamily: 'Alan Sans'}]}>Likes</Text>
                        </View>
                    </View>
                </View>

                {/* Pestañas: Sobre mí, Mi Trabajo, Reseñas */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'sobreMi' && styles.activeTab]}
                        onPress={() => setActiveTab('sobreMi')}>
                        <Text style={[styles.tabText, activeTab === 'sobreMi' && styles.activeTabText, {fontFamily: 'Alan Sans'}]}>Sobre mí</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'miTrabajo' && styles.activeTab]}
                        onPress={() => setActiveTab('miTrabajo')}>
                        <Text style={[styles.tabText, activeTab === 'miTrabajo' && styles.activeTabText, {fontFamily: 'Alan Sans'}]}>Mi Trabajo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'publicaciones' && styles.activeTab]}
                        onPress={() => setActiveTab('publicaciones')}>
                        <Text style={[styles.tabText, activeTab === 'publicaciones' && styles.activeTabText, {fontFamily: 'Alan Sans'}]}>Publicaciones</Text>
                    </TouchableOpacity>
                </View>

                {/* Contenido dinámico de las pestañas */}
                {activeTab === 'sobreMi' && (
                    <View style={styles.tabContent}>
                        <Text style={[styles.tabContentText,{fontFamily: 'Alan Sans'}]}>
                            {artesano?.descripcion || 'Aún no has agregado una descripción sobre ti.'}
                        </Text>

                        {/* Sección de Contacto */}
                        <View style={styles.contactSection}>
                            <Text style={[styles.contactTitle,{fontFamily: 'Alan Sans'}]}>Contacto</Text>
                            {artesano?.telefono && (
                                <View style={styles.contactRow}>
                                    <MaterialCommunityIcons name="phone" size={20} color="#9D046D" />
                                    <Text style={[styles.contactText,{fontFamily: 'Alan Sans'}]}>{artesano.telefono}</Text>
                                </View>
                            )}
                            {session?.user?.email && (
                                <View style={styles.contactRow}>
                                    <MaterialCommunityIcons name="email" size={20} color="#9D046D" />
                                    <Text style={[styles.contactText,{fontFamily: 'Alan Sans'}]}>{session.user.email}</Text>
                                </View>
                            )}
                        </View>

                    </View>
                )}

                {activeTab === 'miTrabajo' && (
                    <View style={styles.gridContainer}>
                        {productos.map(pub => ( // Renderizar productos aquí
                            <TouchableOpacity key={pub.id} style={styles.gridItem} onPress={() => router.push({ pathname: '/ArtesanoProducts', params: { userId: session.user.id } })}>
                                {pub.imagen_url ? (
                                    <Image source={{ uri: pub.imagen_url }} style={styles.gridImage} />
                                ) : (
                                    <View style={styles.gridPlaceholder} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {activeTab === 'publicaciones' && (
                    <View style={styles.gridContainer}>
                        {publicaciones.map(pub => ( // Renderizar publicaciones aquí
                            <TouchableOpacity key={pub.id} style={styles.gridItem} onPress={() => router.push('/ArtesanoPublications')}>
                                {pub.imagen_url ? (
                                    <Image source={{ uri: pub.imagen_url }} style={styles.gridImage} />
                                ) : (
                                    <View style={styles.gridPlaceholder} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

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
    infoText: {
        fontSize: 16,
        color: '#666',
        marginLeft: 8,
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
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 2,
    },
    gridItem: {
        width: (width / 2) - 6, // Ajustado para 3 columnas con padding
        height: (width / 2) - 6, // Mantenemos la proporción cuadrada
        margin: 2,
    },
    gridImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
    },
    gridPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#e0e0e0',
    },
    contactSection: {
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    contactText: {
        fontSize: 14,
        color: '#555',
        marginLeft: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        justifyContent: 'center',
    },
    linkText: {
        color: '#000000', // Color distintivo para el enlace
        textDecorationLine: 'underline',
        marginLeft: 8,
    },
});