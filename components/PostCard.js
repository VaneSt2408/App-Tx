// src/components/PostCard.js
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Componente de tarjeta de publicación (estilo Facebook)
 */
const PostCard = ({ post, onLike, currentUserId }) => {
  const [liked, setLiked] = useState(post.liked_by_user);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiking, setIsLiking] = useState(false);

  // Sincronizar estado cuando cambia el post (útil al recargar)
  useEffect(() => {
    setLiked(post.liked_by_user);
    setLikesCount(post.likes_count);
  }, [post.id, post.liked_by_user, post.likes_count]);

  // Formatear fecha relativa
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) return 'Ahora';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)}d`;
    return postDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  // Manejar like
  const handleLike = async () => {
    if (isLiking || !currentUserId) return;

    setIsLiking(true);

    // Optimistic update
    const wasLiked = liked;
    const previousCount = likesCount;
    
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);

    try {
      const result = await onLike(post.id);
      
      if (result.success) {
        // Actualizar con datos reales del servidor
        setLiked(result.liked);
        setLikesCount(result.likes_count);
      } else {
        // Revertir en caso de error
        setLiked(wasLiked);
        setLikesCount(previousCount);
      }
    } catch (error) {
      // Revertir en caso de error
      setLiked(wasLiked);
      setLikesCount(previousCount);
      console.error('Error al dar like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header: Avatar + Nombre + Tiempo */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {post.artesano.foto ? (
            <Image 
              source={{ uri: post.artesano.foto }} 
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <MaterialCommunityIcons name="account" size={24} color="#666" />
            </View>
          )}
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.artesanoNombre}>{post.artesano.nombre}</Text>
          <View style={styles.metaInfo}>
            {post.artesano.ubicacion && (
              <Text style={styles.metaText}>
                <MaterialCommunityIcons name="map-marker" size={12} color="#666" />
                {' '}{post.artesano.ubicacion}
              </Text>
            )}
            <Text style={styles.separator}>•</Text>
            <Text style={styles.metaText}>{getTimeAgo(post.created_at)}</Text>
          </View>
        </View>
      </View>

      {/* Texto de la publicación */}
      {post.texto && (
        <View style={styles.textContainer}>
          <Text style={styles.text}>{post.texto}</Text>
        </View>
      )}

      {/* Imagen de la publicación */}
      {post.imagen_url && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: post.imagen_url }} 
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Footer: Likes */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.likeButton}
          onPress={handleLike}
          disabled={isLiking || !currentUserId}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={liked ? "heart" : "heart-outline"} 
            size={24} 
            color={liked ? "#e74c3c" : "#666"}
          />
          <Text style={[styles.likeCount, liked && styles.likeCountActive]}>
            {likesCount}
          </Text>
        </TouchableOpacity>

        {/* Placeholders para futuras funciones */}
        <TouchableOpacity style={styles.actionButton} disabled>
          <MaterialCommunityIcons name="comment-outline" size={22} color="#ccc" />
          <Text style={styles.actionText}>0</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} disabled>
          <MaterialCommunityIcons name="share-outline" size={22} color="#ccc" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: '#e1e8ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  artesanoNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  separator: {
    marginHorizontal: 4,
    color: '#666',
  },
  textContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  text: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  imageContainer: {
    width: '100%',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: 300,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  likeCount: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  likeCountActive: {
    color: '#e74c3c',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#ccc',
  },
});

export default PostCard;