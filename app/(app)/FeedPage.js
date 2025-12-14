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

// Ancho de referencia (iPhone 8/X)
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
    const [currentPage, setCurrentPage] = useState(0); // Estado para la paginación
    const [hasMore, setHasMore] = useState(true); // Estado para saber si hay más datos
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const Text = (props) => (
        <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
    );

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
                    // Solo agregamos si hay datos nuevos para evitar duplicados
                    if (result.data.length > 0) {
                        setPosts(prev => [...prev, ...result.data]);
                    }
                }
                setHasMore(result.data.length > 0); // Asumiendo que si regresa data, hay potencial para más
                setCurrentPage(page);
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
        loadFeed(0);
        loadEvents();
    }, [loadFeed, loadEvents]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadFeed(0);
        loadEvents();
    }, [loadFeed, loadEvents]);

    // Lógica loadMore para FlatList
    const loadMore = useCallback(() => {
        // Solo cargar más si no estamos ya cargando, si hay más datos disponibles, y si la carga inicial ya terminó
        if (!loadingMore && hasMore && !loading) {
            setLoadingMore(true);
            loadFeed(currentPage + 1);
        }
    }, [loadingMore, hasMore, loading, currentPage, loadFeed]);


    const handleLike = async (postId) => {
        const result = await FeedService.toggleLikeForCurrentUser(postId);
        return result;
    };


    // 3. Estilos Dinámicos (aplicados al Header, Footer y Empty State)
    const dynamicStyles = StyleSheet.create({
        headerContainer: {
            // py-4 px-4 border-b border-gray-200 mb-7
            paddingVertical: scaledValue(16), 
            paddingHorizontal: scaledValue(16), 
            marginBottom: scaledValue(28), 
        },
        headerTitle: {
            fontSize: scaledValue(24), // text-3xl
        },
        loadingFooter: {
            paddingVertical: scaledValue(20), // py-5
        },
        emptyContainer: {
            paddingHorizontal: scaledValue(40), // px-10 * 4
        },
        emptyIcon: {
            // size 64
        },
        emptyTextLg: {
            marginTop: scaledValue(16), // mt-4 * 4
            fontSize: scaledValue(18), // text-lg
        },
        emptyTextSm: {
            marginTop: scaledValue(8), // mt-2 * 4
            fontSize: scaledValue(14), // text-sm
        },
        loadingIndicatorText: {
            marginTop: scaledValue(12), // mt-3 * 4
        }
    });

    const renderPostsHeader = () => (
        <View style={[{borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff'}, dynamicStyles.headerContainer]}>
            <Text style={[{fontFamily: 'Alan Sans'}, dynamicStyles.headerTitle]} className=" font-bold text-[#9D046D]">Mis Publicaciones</Text>
        </View>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={[styles.centerItems, dynamicStyles.loadingFooter]}>
                <ActivityIndicator size="small" color="#9D046D" />
            </View>
        );
    };

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={[styles.emptyContainer, dynamicStyles.emptyContainer]}>
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

    // Estilos del FAB (Botón de Acción Flotante) aplicados directamente
    const fabSize = scaledValue(56);
    const fabRadius = scaledValue(28);
    const fabRightBottom = scaledValue(20);
    const fabIconSize = scaledValue(28);

    return (
        <View style={styles.fullScreenContainer}>
             {/* BARRA DE ESTADO UNIVERSAL */}
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
                {renderPostsHeader()}

                <EventCarousel 
                    events={events} 
                    onEventPress={(event) => {
                        setSelectedEvent(event);
                        setModalVisible(true);
                    }} 
                />

                {/* FlatList configurado para Carga Infinita */}
                <FlatList
                    data={posts}
                    renderItem={({ item }) => <PostCard post={item} onLike={handleLike} />}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false} // Necesario para que el ScrollView padre maneje el desplazamiento
                    contentContainerStyle={{ paddingBottom: scaledValue(10) }}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={renderEmpty}
                    // Propiedades de Carga Infinita:
                    onEndReached={loadMore} // Llama a loadMore cuando se llega al final
                    onEndReachedThreshold={0.5} // Carga cuando se está a 50% del final
                />
            </ScrollView>

            <EventsModal 
                visible={modalVisible} 
                event={selectedEvent} 
                onClose={() => { 
                    setModalVisible(false); 
                    setSelectedEvent(null); 
                }} 
            />

            {/* Botón de Acción Flotante (FAB) con estilos escalados */}
            {role === 'artesano' && (
                <TouchableOpacity
                    style={[styles.fab, {
                        width: fabSize,
                        height: fabSize,
                        borderRadius: fabRadius,
                        right: fabRightBottom,
                        bottom: fabRightBottom,
                    }]}
                    onPress={() => router.push('/ArtesanoPublications')}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons name="plus" size={fabIconSize} color="#fff" />
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
    },
    centerItems: {
        alignItems: 'center',
    },
    // Estilos FAB Base (solo colores, posición y sombras)
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