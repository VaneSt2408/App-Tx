// app/(app)/FeedPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Alert, 
    FlatList, 
    RefreshControl, 
    ActivityIndicator, 
    Text as DefaultText, 
    TouchableOpacity, 
    ScrollView, 
    StyleSheet,
    useWindowDimensions, // <-- Importado para escalado
    StatusBar,           // <-- Importado para control de la barra de estado
    Platform             // <-- Importado para lógica condicional
} from 'react-native';
import { FeedService } from '../../src/services/FeedService';
import PostCard from '../../components/PostCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getEvents } from '../../src/services/eventsService';
import EventsModal from '../../components/EventsModal'; 
import EventCarousel from '../../components/EventCarousel'; 
import { useAuth } from '../../src/context/AuthContext';

// Ancho de referencia
const REFERENCE_WIDTH = 375; 
const scale = (size, screenWidth) => (screenWidth / REFERENCE_WIDTH) * size;

const FeedPage = () => {
    const { width: screenWidth } = useWindowDimensions(); // 1. Obtener ancho de pantalla
    const scaledValue = (size) => Math.round(scale(size, screenWidth)); // 2. Función de escalado
    
    const router = useRouter();
    const { role, session } = useAuth();
    const [posts, setPosts] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); 
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const Text = (props) => (
        <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
    );

    // Lógica loadFeed, loadEvents, useEffect, onRefresh, handleLike (sin cambios)
    const loadFeed = useCallback(async (page = 0) => {
        try {
            if (page === 0) setLoading(true);

            let result;
            if (role === 'cliente' && session?.user?.id) {
                result = await FeedService.getCustomizedFeedForClient(10, page, session.user.id);
            } else {
                result = await FeedService.getFeedForCurrentUser(10, page);
            }

            if (result.success) {
                if (page === 0) {
                    setPosts(result.data);
                } else {
                    setPosts(prev => [...prev, ...result.data]);
                }
            }
        } catch (error) {
            Alert.alert(
                "Error al cargar el feed",
                error.message || "No se pudieron obtener las publicaciones. Intenta de nuevo."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [role, session?.user?.id]);

    const loadEvents = useCallback(async () => {
        const result = await getEvents();
        if (result.success) {
            setEvents(result.data);
        }
    }, []);

    useEffect(() => {
        loadFeed();
        loadEvents();
    }, [loadFeed, loadEvents]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadFeed(0);
        loadEvents();
    }, [loadFeed, loadEvents]);

    const handleLike = async (postId) => {
        const result = await FeedService.toggleLikeForCurrentUser(postId);
        return result;
    };
    
    // 3. Estilos Dinámicos (aplicados al Header, Footer y Empty State)
    const dynamicStyles = StyleSheet.create({
        headerContainer: {
            paddingVertical: scaledValue(16), // Base 16 (4 de la clase Tailwind px-4 y py-4)
            paddingHorizontal: scaledValue(16), 
            marginBottom: scaledValue(28), // Base 28 (mb-7 * 4)
        },
        headerTitle: {
            fontSize: scaledValue(24), // Base 24 (text-3xl)
        },
        loadingFooter: {
            paddingVertical: scaledValue(20), // Base 20 (py-5 * 4)
        },
        emptyIcon: {
            marginTop: scaledValue(0), // No tiene margin vertical, pero se deja por si acaso.
        },
        emptyTextLg: {
            marginTop: scaledValue(16), // Base 16 (mt-4 * 4)
            fontSize: scaledValue(18), // Base 18 (text-lg)
        },
        emptyTextSm: {
            marginTop: scaledValue(8), // Base 8 (mt-2 * 4)
            fontSize: scaledValue(14), // Base 14 (text-sm)
        },
        loadingIndicatorText: {
            marginTop: scaledValue(12), // Base 12 (mt-3 * 4)
        }
    });


    // Actualizado con estilos dinámicos
    const renderPostsHeader = () => (
        <View style={[{borderBottomWidth: 1, borderBottomColor: '#e5e7eb'}, dynamicStyles.headerContainer]}>
            <Text style={[{fontFamily: 'Alan Sans'}, dynamicStyles.headerTitle]} className=" font-bold text-[#9D046D]">Mis Publicaciones</Text>
        </View>
    );

    // Actualizado con estilos dinámicos
    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={[styles.centerItems, dynamicStyles.loadingFooter]}>
                <ActivityIndicator size="small" color="#9D046D" />
            </View>
        );
    };

    // Actualizado con estilos dinámicos
    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="post-outline" size={scaledValue(64)} color="#ccc" style={dynamicStyles.emptyIcon} />
                <Text style={[{fontFamily: 'Alan Sans'}, dynamicStyles.emptyTextLg]} className="font-semibold text-gray-600 text-center">
                    No hay publicaciones aún
                </Text>
                <Text style={dynamicStyles.emptyTextSm} className="text-gray-500 text-center">
                    ¡Sé el primero en publicar algo!
                </Text>
            </View>
        );
    };

    if (loading && posts.length === 0 && events.length === 0) {
        return (
            <View style={styles.loadingFullContainer}>
                <ActivityIndicator size="large" color="#9D046D" />
                <Text style={dynamicStyles.loadingIndicatorText} className="text-sm text-gray-600">Cargando...</Text>
            </View>
        );
    }

    return (
        <View style={styles.fullScreenContainer}>
            {/* 4. Barra de Estado Universal */}
            <StatusBar 
                barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'} 
                backgroundColor={Platform.OS === 'android' ? '#000000' : 'transparent'} 
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#9D046D']}
                        tintColor="#9D046D"
                    />
                }
            >
                {/* Sección de Publicaciones */}
                {renderPostsHeader()}

                {/* Carrusel de Eventos con encabezado */}
                <EventCarousel 
                    events={events} 
                    onEventPress={(event) => {
                        setSelectedEvent(event);
                        setModalVisible(true);
                    }} />

                {/* Publicaciones */}
                <FlatList
                    data={posts}
                    renderItem={({ item }) => <PostCard post={item} onLike={handleLike} />}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                    contentContainerStyle={{ paddingBottom: scaledValue(10) }}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={renderEmpty}
                />
            </ScrollView>

            {/* Modal */}
            <EventsModal 
                visible={modalVisible} 
                event={selectedEvent} 
                onClose={() => { 
                    setModalVisible(false); 
                    setSelectedEvent(null); 
                }} 
            />

            {/* Botón de Acción Flotante (FAB) */}
            {role === 'artesano' && (
                <TouchableOpacity
                    style={[styles.fab, {
                        width: scaledValue(56),
                        height: scaledValue(56),
                        borderRadius: scaledValue(28),
                        right: scaledValue(20),
                        bottom: scaledValue(20),
                    }]}
                    onPress={() => router.push('/ArtesanoPublications')}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons name="plus" size={scaledValue(28)} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1, 
        backgroundColor: '#f3f4f6' // bg-gray-100
    },
    loadingFullContainer: {
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#f3f4f6'
    },
    emptyContainer: {
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: 40 // px-10 * 4
    },
    centerItems: {
        alignItems: 'center',
    },
    // Estilos FAB Base (solo colores y sombras)
    fab: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#9D046D',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});

export default FeedPage;