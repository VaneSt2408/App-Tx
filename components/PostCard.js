// En: components/PostCard.js -> Archivo de la tarjeta de publicación (Frontend)
// Este archivo es el encargado de mostrar la tarjeta de publicación en la aplicación.
// Muestra la tarjeta de publicación registrada en la base de datos y permite navegar a la página del artesano y realizar likes.

// Importaciones
import React, { useState, useEffect } from 'react';
import { View, Text as DefaultText, Image, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useCustomFonts from '../hooks/useFonts';

/**
 * Componente de tarjeta de publicación (estilo Facebook)
 */
const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
  );

  
const PostCard = ({ post, onLike }) => {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(post.liked_by_user);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [likeLoading, setLikeLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0); // Estado para el carrusel
  const { width } = useWindowDimensions(); // Obtener ancho dinámico

  // Sincronizar estado cuando cambia el post (útil al recargar)
  useEffect(() => {
    setIsLiked(post.liked_by_user);
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

  // Navegar al perfil del artesano
  const handleNavigateToProfile = () => {
    
    if (post.artesano?.id) {
      router.push({
        pathname: '/ArtesanoProfileVistaVisitante', // Cambiar a la ruta correcta
        params: { userId: post.artesano.id.toString() }
      });
    } else {
    }
  };

  // Manejar like
  const handleLikePress = async () => {
    if (likeLoading) return;
    setLikeLoading(true);

    // Actualización visual inmediata
    setIsLiked(!isLiked);
    setLikesCount(prev => (isLiked ? prev - 1 : prev + 1));

    const result = await onLike(post.id);
    if (!result.success) {
      // Si falla, revertimos el cambio visual
      setIsLiked(post.liked_by_user);
      setLikesCount(post.likes_count);
    } else {
      // Sincronizamos con la respuesta final del servidor
      setIsLiked(result.liked);
      setLikesCount(result.likes_count);
    }
    setLikeLoading(false);
  };

  // Construir la galería de imágenes
  const imageGallery = [
    // La imagen de portada siempre va primero
    { id: 'cover', imagen_url: post.imagen_url },
    // El resto de imágenes, filtrando para no duplicar la portada
    ...(post.imagenes?.filter(img => img.imagen_url !== post.imagen_url).map((img, index) => ({ ...img, id: `gallery-${index}` })) || [])
  ].filter(img => img.imagen_url); // Filtrar cualquier imagen que pueda ser nula

  const onViewableItemsChanged = React.useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }, []);

  return (
    <View style={styles.card}>
      {/* Header: Avatar + Nombre + Tiempo */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {post.artesano?.avatar_url ? (
            <Image 
              source={{ uri: post.artesano.avatar_url }} 
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <MaterialCommunityIcons name="account" size={24} color="#666" />
            </View>
          )}
        </View>

        <View style={styles.headerInfo}>
          <TouchableOpacity onPress={handleNavigateToProfile} activeOpacity={0.7}>
            <Text style={[styles.artesanoNombre,{fontFamily: 'Alan Sans'}]}>{post.artesano.nombre}</Text>
          </TouchableOpacity>
          <View style={styles.metaInfo}>
            {post.artesano.ubicacion && (
              <Text style={[styles.metaText,{fontFamily: 'Alan Sans'}]}>
                <MaterialCommunityIcons name="map-marker" size={12} color="#666" />
                {` ${post.artesano.ubicacion}`}
              </Text>
            )}
            <Text style={styles.separator}>•</Text>
            <Text style={[styles.metaText,{fontFamily: 'Alan Sans'}]}>{getTimeAgo(post.created_at)}</Text>
          </View>
        </View>
      </View>

      {/* Texto de la publicación */}
      {post.texto && (
        <View style={styles.textContainer}>
          <Text style={styles.text}>{post.texto}</Text>
        </View>
      )}

      {/* Galería de Imágenes */}
      {imageGallery.length > 0 ? (
        <View style={[styles.imageContainer, { height: width }]}>
          <FlatList
            data={imageGallery}
            renderItem={({ item }) => (
              <Image source={{ uri: item.imagen_url }} style={[styles.image, { width: width, height: width }]} />
            )}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          />
          {imageGallery.length > 1 && (
            <View style={styles.pagination}>
              {imageGallery.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, index === activeIndex ? styles.dotActive : {}]}
                />
              ))}
            </View>
          )}
        </View>
      ) : null}

      {/* Footer: Likes */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.likeButton}
          onPress={handleLikePress}
          disabled={likeLoading}
          activeOpacity={0.7}
        >
          {likeLoading ? (
            <ActivityIndicator size="small" color="#e91e63" />
          ) : (
            <MaterialCommunityIcons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={28}
              color={isLiked ? '#e91e63' : '#333'}
            />
          )}
          <Text style={[styles.likeCount, isLiked && styles.likeCountActive]}>
            {likesCount}
          </Text>
        </TouchableOpacity>

        {/* Iconos de acción como comentarios y compartir han sido eliminados */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginBottom: 20,
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

  artesanoNombre: {   //AQUI SE PUEDE ENCONTRAR EL COLOR DEL NOMBRE DENTRO DE LAS PUBLICACIONES QUE APARECEN ESTILO INSTAGRAM
    fontSize: 15,
    fontWeight: '600',
    color: '#9D046D',
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
  },
  pagination: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Color de punto inactivo (gris)
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: '#9D046D', // Color de punto activo (color de la marca)
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
    fontWeight: 'bold',
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