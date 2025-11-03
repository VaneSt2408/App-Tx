// src/components/ProductCard.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Componente de tarjeta de producto (estilo Facebook Marketplace)
 */
const ProductCard = ({ product, onPress }) => {
  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onPress && onPress(product)}
      activeOpacity={0.7}
    >
      {/* Imagen del producto */}
      <View style={styles.imageContainer}>
        {product.imagen_url ? (
          <Image 
            source={{ uri: product.imagen_url }} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <MaterialCommunityIcons name="image-off" size={40} color="#ccc" />
          </View>
        )}
      </View>

      {/* Información del producto */}
      <View style={styles.info}>
        {/* Precio */}
        <Text style={styles.price}>{formatPrice(product.precio)}</Text>
        
        {/* Nombre del producto */}
        <Text style={styles.nombre} numberOfLines={2}>
          {product.nombre}
        </Text>

        {/* Ubicación del artesano */}
        {product.artesano?.ubicacion && (
          <View style={styles.locationContainer}>
            <MaterialCommunityIcons 
              name="map-marker-outline" 
              size={14} 
              color="#666" 
            />
            <Text style={styles.location} numberOfLines={1}>
              {product.artesano.ubicacion}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1, // Mantiene proporción cuadrada como Facebook
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  info: {
    padding: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  nombre: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  location: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
});

export default ProductCard;