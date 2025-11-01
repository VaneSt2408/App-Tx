// src/pages/ProductDetailPage.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MarketplaceService from '../services/MarketplaceService';

const ProductDetailPage = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadProductDetail();
  }, [productId]);

  const loadProductDetail = async () => {
    try {
      setLoading(true);
      const result = await MarketplaceService.getProducto(productId);
      
      if (result.success) {
        setProduct(result.data);
      } else {
        Alert.alert('Error', 'No se pudo cargar el producto');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error al cargar producto:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Determinar disponibilidad
  const isAvailable = product?.estado === 'activo';

  // Handlers para botones (placeholders)
  const handleSave = () => {
    setSaved(!saved);
    Alert.alert(
      saved ? 'Eliminado' : 'Guardado',
      saved ? 'Producto eliminado de guardados' : 'Producto guardado correctamente'
    );
  };

  const handleContact = () => {
    Alert.alert(
      'Contactar Artesano',
      'Próximamente podrás contactar directamente al artesano a través de chat.',
      [{ text: 'OK' }]
    );
  };

  const handleShare = () => {
    Alert.alert(
      'Compartir Producto',
      'Próximamente podrás compartir este producto con tus contactos.',
      [{ text: 'OK' }]
    );
  };

  const handleArtesanoPress = () => {
    Alert.alert(
      'Perfil del Artesano',
      'Próximamente podrás ver el perfil completo del artesano.',
      [{ text: 'OK' }]
    );
    // TODO: Navegar a perfil del artesano
    // navigation.navigate('ArtesanoProfile', { artesanoId: product.artesano.id });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2575fc" />
        <Text style={styles.loadingText}>Cargando producto...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Producto no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Imagen del Producto */}
        <View style={styles.imageContainer}>
          {product.imagen_url ? (
            <Image 
              source={{ uri: product.imagen_url }} 
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <MaterialCommunityIcons name="image-off" size={80} color="#ccc" />
            </View>
          )}
        </View>

        {/* Contenido Principal */}
        <View style={styles.content}>
          {/* Precio */}
          <Text style={styles.price}>{formatPrice(product.precio)}</Text>

          {/* Título */}
          <Text style={styles.title}>{product.nombre}</Text>

          {/* Disponibilidad */}
          <View style={styles.availabilityContainer}>
            <MaterialCommunityIcons 
              name={isAvailable ? "check-circle" : "close-circle"}
              size={20}
              color={isAvailable ? "#4caf50" : "#f44336"}
            />
            <Text style={[
              styles.availabilityText,
              { color: isAvailable ? "#4caf50" : "#f44336" }
            ]}>
              {isAvailable ? "Disponible" : "No disponible"}
            </Text>
          </View>

          {/* Botones de Acción */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.saveButton, saved && styles.savedButton]}
              onPress={handleSave}
            >
              <MaterialCommunityIcons 
                name={saved ? "bookmark" : "bookmark-outline"}
                size={20}
                color={saved ? "#2575fc" : "#666"}
              />
              <Text style={[styles.actionButtonText, saved && styles.savedButtonText]}>
                {saved ? "Guardado" : "Guardar"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.contactButton]}
              onPress={handleContact}
            >
              <MaterialCommunityIcons name="message-text-outline" size={20} color="#fff" />
              <Text style={styles.contactButtonText}>Contactar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.shareButton]}
              onPress={handleShare}
            >
              <MaterialCommunityIcons name="share-variant-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Separador */}
          <View style={styles.separator} />

          {/* Descripción */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{product.descripcion}</Text>
          </View>

          {/* Separador */}
          <View style={styles.separator} />

          {/* Categoría */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categoría</Text>
            <View style={styles.categoryTag}>
              <MaterialCommunityIcons name="tag-outline" size={16} color="#2575fc" />
              <Text style={styles.categoryText}>{product.categoria || 'General'}</Text>
            </View>
          </View>

          {/* Separador */}
          <View style={styles.separator} />

          {/* Información del Artesano */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Artesano</Text>
            <TouchableOpacity 
              style={styles.artesanoCard}
              onPress={handleArtesanoPress}
              activeOpacity={0.7}
            >
              <View style={styles.artesanoAvatar}>
                {product.artesano.foto ? (
                  <Image 
                    source={{ uri: product.artesano.foto }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <MaterialCommunityIcons name="account" size={32} color="#666" />
                  </View>
                )}
              </View>
              <View style={styles.artesanoInfo}>
                <Text style={styles.artesanoName}>{product.artesano.nombre}</Text>
                {product.artesano.categoria && (
                  <Text style={styles.artesanoCategory}>
                    {product.artesano.categoria}
                  </Text>
                )}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Separador */}
          <View style={styles.separator} />

          {/* Ubicación */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            <View style={styles.locationContainer}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
              <Text style={styles.locationText}>
                {product.artesano.ubicacion || 'Ubicación no especificada'}
              </Text>
            </View>
          </View>

          {/* Espaciado inferior */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
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
  content: {
    padding: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 26,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  availabilityText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#fff',
  },
  savedButton: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2575fc',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  savedButtonText: {
    color: '#2575fc',
  },
  contactButton: {
    flex: 2,
    backgroundColor: '#2575fc',
    borderColor: '#2575fc',
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  shareButton: {
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 14,
    color: '#2575fc',
    fontWeight: '500',
    marginLeft: 6,
  },
  artesanoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
  },
  artesanoAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artesanoInfo: {
    flex: 1,
  },
  artesanoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  artesanoCategory: {
    fontSize: 13,
    color: '#666',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default ProductDetailPage;