// src/pages/FeedPage.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '../../src/supabase/client';
import FeedService from '../../src/services/FeedService';
import PostCard from '../../components/PostCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';


const FeedPage = () => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Obtener usuario actual
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Cargar feed inicial
  useEffect(() => {
    loadFeed();
  }, [currentUserId]);

  // Función para cargar el feed
  const loadFeed = async (page = 0) => {
    try {
      if (page === 0) {
        setLoading(true);
      }

      const result = await FeedService.getFeed(10, page, currentUserId);

      if (result.success) {
        if (page === 0) {
          setPosts(result.data);
        } else {
          setPosts(prev => [...prev, ...result.data]);
        }
        setHasMore(result.hasMore);
        setCurrentPage(page);
      } else {
        console.error('Error al cargar feed:', result.error);
      }
    } catch (error) {
      console.error('Error en loadFeed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFeed(0);
  }, [currentUserId]);

  // Cargar más publicaciones (infinite scroll)
  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      loadFeed(currentPage + 1);
    }
  };

  // Manejar like
  const handleLike = async (postId) => {
    if (!currentUserId) {
      return { success: false, error: 'Debes iniciar sesión para dar like' };
    }

    const result = await FeedService.toggleLike(postId, currentUserId);
    return result;
  };

  // Renderizar cada publicación
  const renderPost = ({ item }) => (
    <PostCard 
      post={item} 
      onLike={handleLike}
      currentUserId={currentUserId}
    />
  );

  // Renderizar footer (loading más publicaciones)
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2575fc" />
      </View>
    );
  };

  // Renderizar cuando está vacío
  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="post-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No hay publicaciones aún</Text>
        <Text style={styles.emptySubtext}>¡Sé el primero en publicar algo!</Text>
      </View>
    );
  };

  // Renderizar header
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Publicaciones</Text>
    </View>
  );

  
  if (loading && posts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2575fc" />
        <Text style={styles.loadingText}>Cargando publicaciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
        
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2575fc']}
            tintColor="#2575fc"
          />
        }

        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={posts.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      />
    
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  list: {
    paddingTop: 8,
    paddingBottom: 80,
  },
  emptyList: {
    flexGrow: 1,
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  // --- NUEVO: Estilos para el Botón Flotante (FAB) ---
    fab: {
        position: 'absolute', // Posición fija
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        right: 30, // Distancia desde la derecha
        bottom: 30, // Distancia desde abajo
        backgroundColor: '#2575fc',
        borderRadius: 30, // Círculo perfecto
        elevation: 8, // Sombra en Android
        shadowColor: '#000', // Sombra en iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
});

export default FeedPage;