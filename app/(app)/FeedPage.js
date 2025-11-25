// app/(app)/FeedPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { View,Alert, FlatList, RefreshControl, ActivityIndicator, Text as DefaultText, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import FeedService from '../../src/services/FeedService';
import PostCard from '../../components/PostCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getEvents } from '../../src/services/eventsService';
import EventsModal from '../../components/EventsModal'; // 1. Importar el modal
import EventCarousel from '../../components/EventCarousel'; // Importa el nuevo componente
import { useAuth } from '../../src/context/AuthContext';

const FeedPage = () => {
  const router = useRouter();
  const { role, session } = useAuth(); // Obtener el rol y la sesión del usuario
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); 
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null); // 2. Estado para el evento seleccionado
  const [modalVisible, setModalVisible] = useState(false); // 3. Estado para la visibilidad del modal

  useEffect(() => {
    loadFeed();
    loadEvents();
  }, []);

  const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
  );

  const loadFeed = async (page = 0) => {
    try {
      if (page === 0) setLoading(true);

      let result;
      // Si el usuario es un cliente, usamos el nuevo feed personalizado.
      if (role === 'cliente' && session?.user?.id) {
        result = await FeedService.getCustomizedFeedForClient(10, page, session.user.id);
      } else {
        // Para artesanos o si no hay sesión, usamos el feed general.
        result = await FeedService.getFeedForCurrentUser(10, page);
      }

      if (result.success) {
        if (page === 0) {
          setPosts(result.data);
        } else {
          setPosts(prev => [...prev, ...result.data]);
        }
        setHasMore(result.hasMore);
        setCurrentPage(page);
      }
    } catch (error) {
      // Manejo de errores mejorado
      Alert.alert(
        "Error al cargar el feed",
        error.message || "No se pudieron obtener las publicaciones. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const loadEvents = async () => {
    const result = await getEvents();
    if (result.success) {
      setEvents(result.data);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFeed(0);
    loadEvents();
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      loadFeed(currentPage + 1);
    }
  };

  const handleLike = async (postId) => {
    const result = await FeedService.toggleLikeForCurrentUser(postId);
    return result;
  };

  const renderPostsHeader = () => (
    <View className="bg-white py-3 px-4 border-b border-gray-200 mb-3">
      <Text style={{fontFamily: 'Alan Sans'}} className=" font-semibold text-3xl text-gray-900">Mis Publicaciones</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-5 items-center">
        <ActivityIndicator size="small" color="#9D046D" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View className="flex-1 justify-center items-center px-10">
        <MaterialCommunityIcons name="post-outline" size={64} color="#ccc" />
        <Text style={{fontFamily: 'Alan Sans'}} className="mt-4 text-lg font-semibold text-gray-600 text-center">
          No hay publicaciones aún
        </Text>
        <Text className="mt-2 text-sm text-gray-500 text-center">
          ¡Sé el primero en publicar algo!
        </Text>
      </View>
    );
  };

  if (loading && posts.length === 0 && events.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#9D046D" />
        <Text className="mt-3 text-sm text-gray-600">Cargando...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
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
        {/* 4. Pasar la prop onEventPress para abrir el modal */}
        <EventCarousel 
          events={events} 
          onEventPress={(event) => {
            setSelectedEvent(event);
            setModalVisible(true);
          }} />

        {/* Lista de Publicaciones */}
        <FlatList
          data={posts}
          renderItem={({ item }) => <PostCard post={item} onLike={handleLike} />}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 10 }}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      </ScrollView>

      {/* 5. Añadir el componente del modal a la pantalla */}
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
          style={styles.fab}
          onPress={() => router.push('/ArtesanoPublications')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20, // Se ajustará sobre el tab bar
    backgroundColor: '#9D046D',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default FeedPage;