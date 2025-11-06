import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

/**
 * Componente reutilizable para mostrar elementos destacados:
 * - artesanos
 * - eventos
 * - productos
 *
 * Props:
 * - type: 'artesano' | 'evento' | 'producto'
 * - item: objeto con los campos relevantes según el tipo
 * - onPress: función opcional cuando se pulsa la tarjeta
 */
const FeaturedCard = ({ type = 'artesano', item = {}, onPress }) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) return onPress(item);

    // Navegación por defecto según tipo
    try {
      if (type === 'artesano' && item.user_id) {
        router.push({ pathname: '/ArtesanoProfile', params: { userId: item.user_id.toString() } });
        return;
      }

      if (type === 'producto' && item.id) {
        router.push({ pathname: '/ProductDetailPage', params: { productId: item.id.toString() } });
        return;
      }

      if (type === 'evento' && item.id) {
        router.push({ pathname: '/EventDetail', params: { eventId: item.id.toString() } });
        return;
      }
    } catch (e) {
      // Si la ruta no existe o hay un error, simplemente no hacer nada
    }
  };

  const renderBadge = () => {
    if (type === 'artesano') {
      return (
        <View style={styles.badge}>
          <MaterialCommunityIcons name="star" size={14} color="#fff" />
          <Text style={styles.badgeText}>{item.total_likes ?? item.likes ?? 0} likes</Text>
        </View>
      );
    }

    if (type === 'producto') {
      return (
        <View style={styles.badge}>
          <MaterialCommunityIcons name="tag" size={14} color="#fff" />
          <Text style={styles.badgeText}>{item.precio ? `S/${item.precio}` : (item.price ? `$${item.price}` : '—')}</Text>
        </View>
      );
    }

    if (type === 'evento') {
      return (
        <View style={styles.badge}>
          <MaterialCommunityIcons name="calendar" size={14} color="#fff" />
          <Text style={styles.badgeText}>{item.fecha || item.date || 'Próximo'}</Text>
        </View>
      );
    }

    return null;
  };

  const title = (() => {
    if (type === 'artesano') return item.nombre || item.name || 'Artesano';
    if (type === 'producto') return item.nombre || item.title || item.name || 'Producto';
    if (type === 'evento') return item.titulo || item.title || item.name || 'Evento';
    return '';
  })();

  const subtitle = (() => {
    if (type === 'artesano') return item.ubicacion || item.location || '';
    if (type === 'producto') return item.descripcion || item.description || '';
    if (type === 'evento') return item.ubicacion || item.location || '';
    return '';
  })();

  const imageUrl = (() => {
    if (type === 'artesano') return item.avatar_url || item.avatar || null;
    if (type === 'producto') return item.imagen_url || item.image_url || item.image || null;
    if (type === 'evento') return item.imagen_url || item.image || null;
    return null;
  })();

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={handlePress}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <MaterialCommunityIcons name={type === 'artesano' ? 'account' : type === 'producto' ? 'cube-outline' : 'calendar'} size={28} color="#999" />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {renderBadge()}
        </View>

        {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}

        {/* Small meta row */}
        <View style={styles.metaRow}>
          {type === 'artesano' && (
            <Text style={styles.metaText}>{item.total_productos ? `${item.total_productos} productos` : ''}</Text>
          )}
          {type === 'evento' && item.organizador && (
            <Text style={styles.metaText}>{item.organizador}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    flexDirection: 'column',
    alignItems: 'stretch',
    width: '100%',
  },
  image: {
    width: '100%',
    height: 160,
  },
  imagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    height: 160,
  },
  content: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    flex: 1,
    marginRight: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#9D046D',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 6,
  },
  metaRow: {
    marginTop: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
});

export default FeaturedCard;
