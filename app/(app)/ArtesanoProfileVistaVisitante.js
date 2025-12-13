// En: app/(app)/ArtesanoProfileVistaVisitante.js -> Vista de perfil para visitantes
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text as DefaultText, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, Dimensions, Alert, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { artesanoService } from '../../src/services/artesanoService';
import { seguidosService } from '../../src/services/seguidosService'; // Importar el nuevo servicio
import { useAuth } from '../../src/context/AuthContext';

const { width } = Dimensions.get('window');

const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
);

export default function ArtesanoProfileVistaVisitante() {
    const router = useRouter();
    const { userId, email } = useLocalSearchParams(); // Obtener userId y email de los parámetros
    const { session, role } = useAuth(); // Obtener la sesión y el rol del usuario actual
    const [artesano, setArtesano] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('sobreMi'); // Estado para la pestaña activa
    const [publicaciones, setPublicaciones] = useState([]); // Estado para las publicaciones del artesano
    const [productos, setProductos] = useState([]); // Estado para los productos del artesano
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    // Función para verificar si el usuario actual sigue al artesano
    const checkIfFollowing = useCallback(async (artesanoId) => {
        if (!session?.user?.id || !artesanoId) return;
        // Usar el servicio para verificar el seguimiento
        const isCurrentlyFollowing = await seguidosService.checkIfFollowing(session.user.id, artesanoId);
        setIsFollowing(isCurrentlyFollowing);
    }, [session?.user?.id]);

    const loadArtesanoProfile = useCallback(async (id, isInitialLoad = false) => {
        try {
            if (isInitialLoad) setLoading(true);
            const data = await artesanoService.getArtesanoCompleto(id);
            setArtesano(data.artesano);
            setPublicaciones(data.publicaciones || []);
            setProductos(data.productos || []); // Cargar los productos
            checkIfFollowing(id); // Verificar si el usuario actual sigue a este artesano
        } catch (error) {
            console.error('Error al cargar perfil:', error);
            Alert.alert("Error", "No se pudo cargar el perfil del artesano.");
        } finally {
            if (isInitialLoad) setLoading(false);
            setRefreshing(false);
        }
    }, [checkIfFollowing]);

    useEffect(() => {
        if (userId) {
            loadArtesanoProfile(userId, true); // Carga inicial
        } else {
            Alert.alert("Error", "No se proporcionó un ID de artesano.");
            router.back();
        }
    }, [userId, loadArtesanoProfile, router]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadArtesanoProfile(userId);
    }, [userId, loadArtesanoProfile]);

    // Función para seguir o dejar de seguir a un artesano
    const handleFollowToggle = async () => {
        if (followLoading || !session?.user?.id) return;
        setFollowLoading(true);
        try {
            let result;
            if (isFollowing) {
                // Usar el servicio para dejar de seguir
                result = await seguidosService.unfollowArtesano(session.user.id, userId);
            } else {
                // Usar el servicio para seguir
                result = await seguidosService.followArtesano(session.user.id, userId);
            }

            if (result.success) {
                setIsFollowing(!isFollowing);
            } else {
                throw result.error || new Error('La operación de seguimiento falló.');
            }
        } catch (_) {
            Alert.alert('Error', 'No se pudo completar la acción. Inténtalo de nuevo.');
        } finally {
            setFollowLoading(false);
        }
    };

    // Función para abrir el enlace de Google Maps
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
                    <Text style={styles.loadingText}>Cargando perfil del artesano...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!artesano) {
        return (
            <SafeAreaView style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                    <Text> Volver</Text>
                </TouchableOpacity>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>No se pudo cargar el perfil del artesano.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                <Text> Volver</Text>
            </TouchableOpacity>
            <ScrollView 
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#9D046D']}
                    />
                }
            >
                {/* Header con foto de perfil, nombre y botones */}
                <View style={[styles.header, { fontFamily: 'Alan Sans' }]}>
                    <View style={styles.avatarContainer}>
                        {artesano.avatar_url ? (
                            <Image source={{ uri: artesano.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.defaultAvatar}>
                                <MaterialCommunityIcons name="account" size={50} color="#fff" />
                            </View>
                        )}
                    </View>

                    <Text style={[styles.name, { fontFamily: 'Alan Sans' }]}>{artesano.nombre || 'Artesano sin nombre'}</Text>
                    <Text style={styles.specialty}>{artesano.categoria || 'Ceramista'}</Text>

                    {/* Bloque de Ubicación con enlace a Google Maps */}
                     {artesano?.link_ubicacion && artesano?.ubicacion && (
                         <TouchableOpacity 
                             style={styles.infoRow} 
                             onPress={() => handleOpenMaps(artesano.link_ubicacion)}>
                             <MaterialCommunityIcons name="map-marker-outline" size={16} color="#FD2D1C" />
                             <Text style={[styles.infoText, styles.linkText, {fontFamily: 'Alan Sans'}]}>{artesano.ubicacion}</Text>
                         </TouchableOpacity>
                     )}

                    {/* Botón de Seguir (solo para visitantes) */}
                    {role === 'cliente' && (
                        <TouchableOpacity
                            style={[
                                styles.followButton,
                                isFollowing && styles.followingButton,
                                followLoading && styles.followButtonLoading,
                            ]}
                            onPress={handleFollowToggle}
                            disabled={followLoading}
                        >
                            {followLoading ? (
                                <ActivityIndicator size="small" color={isFollowing ? '#333' : '#fff'} />
                            ) : (
                                <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                                    {isFollowing ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Métricas: Seguidores, Publicaciones, Valoración */}
                    <View style={styles.metricsContainer}>
                        <View style={styles.metricCard}>
                            <Text style={[styles.metricNumber, { fontFamily: 'Alan Sans' }]}>{productos.length}</Text>
                            <Text style={[styles.metricLabel, { fontFamily: 'Alan Sans' }]}>Productos</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={[styles.metricNumber, { fontFamily: 'Alan Sans' }]}>{publicaciones.length}</Text>
                            <Text style={[styles.metricLabel, { fontFamily: 'Alan Sans' }]}>Publicaciones</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={[styles.metricNumber, { fontFamily: 'Alan Sans' }]}>{artesano?.total_likes || 0}</Text>
                            <Text style={[styles.metricLabel, { fontFamily: 'Alan Sans' }]}>Likes</Text>
                        </View>
                    </View>
                </View>

                {/* Pestañas */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'sobreMi' && styles.activeTab]}
                        onPress={() => setActiveTab('sobreMi')}>
                        <Text style={[styles.tabText, activeTab === 'sobreMi' && styles.activeTabText, { fontFamily: 'Alan Sans' }]}>Descripción</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'miTrabajo' && styles.activeTab]}
                        onPress={() => setActiveTab('miTrabajo')}>
                        <Text style={[styles.tabText, activeTab === 'miTrabajo' && styles.activeTabText, { fontFamily: 'Alan Sans' }]}>Productos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'publicaciones' && styles.activeTab]}
                        onPress={() => setActiveTab('publicaciones')}>
                        <Text style={[styles.tabText, activeTab === 'publicaciones' && styles.activeTabText, { fontFamily: 'Alan Sans' }]}>Publicaciones</Text>
                    </TouchableOpacity>
                </View>

                {/* Contenido dinámico de las pestañas */}
                {activeTab === 'sobreMi' && (
                    <View style={styles.tabContent}>
                        <Text style={[styles.tabContentText, { fontFamily: 'Alan Sans' }]}>
                            {artesano?.descripcion || 'Este artesano aún no ha agregado una descripción.'}
                        </Text>

                        {/* Sección de Contacto */}
                        <View style={styles.contactSection}>
                            <Text style={styles.contactTitle}>Contacto</Text>
                            {artesano?.telefono && (
                                <View style={styles.contactRow}>
                                    <MaterialCommunityIcons name="phone" size={20} color="#9D046D" />
                                    <Text style={styles.contactText}>{artesano.telefono}</Text>
                                </View>
                            )}
                            {/* Usamos el email que viene como parámetro */}
                            {email && ( 
                                <View style={styles.contactRow}>
                                    <MaterialCommunityIcons name="email" size={20} color="#9D046D" />
                                    <Text style={styles.contactText}>{email}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {activeTab === 'miTrabajo' && (
                    <View style={styles.gridContainer}> 
                        {productos.map(pub => (
                            <TouchableOpacity key={pub.id} style={styles.gridItem}>
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
                        {publicaciones.map(pub => (
                            <TouchableOpacity key={pub.id} style={styles.gridItem}>
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
    backButton: {
        position: 'absolute',
        top: 40,
        left: 10,
        zIndex: 10,
        flexDirection: 'row',
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
    infoText: {
        fontSize: 16,
        color: '#666',
        marginLeft: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
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
        width: (width / 3) - 6, // 3 columnas
        height: (width / 3) - 6,
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
        marginBottom: 20,
    },
    // Estilos para el botón de seguir
    followButton: {
        marginTop: 16,
        backgroundColor: '#9D046D',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        width: '80%',
        marginBottom: 20, // Añadido para dar espacio debajo del botón
    },
    followingButton: {
        backgroundColor: '#e0e0e0',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    followButtonLoading: {
        opacity: 0.7,
    },
    followButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    followingButtonText: {
        color: '#333',
    },
});