// app/(app)/FeedPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator, Text as DefaultText, TouchableOpacity, ScrollView} from 'react-native';
import FeedService from '../../src/services/FeedService';
import PostCard from '../../components/PostCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useCustomFonts from '../../hooks/useFonts';
import { getEvents } from '../../src/services/eventsService';
import EventCarousel from '../../components/EventCarousel'; // Importa el nuevo componente

const FeedPage = () => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadFeed();
    loadEvents();
  }, []);

  const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'AlanSans' }, props.style]} />
  );

  const loadFeed = async (page = 0) => {
    try {
      if (page === 0) setLoading(true);
      const result = await FeedService.getFeedForCurrentUser(10, page);
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
      // Manejo de errores original
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
      <Text className="text-lg font-semibold text-gray-900">Mis Publicaciones</Text>
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
        <Text className="mt-4 text-lg font-semibold text-gray-600 text-center">
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
        <EventCarousel events={events} />

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
    </View>
  );
};

export default FeedPage;