// En: app/(app)/ProductDetailPage.js -> Archivo de detalle de producto (Frontend)
// Este archivo es el encargado de mostrar el detalle de un producto en la aplicación.
// Muestra el detalle de un producto registrado en la base de datos y permite guardar el producto, contactar al artesano y compartir el producto.

// Importaciones
import React, { useState, useEffect } from 'react';
import {View,Text as DefaultText,Image,ScrollView,TouchableOpacity,StyleSheet,ActivityIndicator,Alert,} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router'; 
import MarketplaceService from '../../src/services/MarketplaceService';
import { toggleLikeProduct  } from '../../src/services/productService';
import useCustomFonts from '../../hooks/useFonts';

// Componente principal
export default function ProductDetailPage() {
  const router = useRouter(); // Obtener el router
  const { productId } = useLocalSearchParams(); // Obtener el id del producto
  const [product, setProduct] = useState(null); // Establecer el estado del producto
  const [loading, setLoading] = useState(true); // Establecer el estado de carga
  const [saved, setSaved] = useState(false); // Establecer el estado de guardado
  const [isLiked, setIsLiked] = useState(false); // Estado para controlar si el producto tiene like
  const [likesCount, setLikesCount] = useState(0); // Estado para contar los likes

  const Text = (props) => (
      <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
    );

  // Cargar el detalle del producto
  useEffect(() => {
    loadProductDetail();
  }, [productId]);

  // Función para cargar el detalle del producto
  const loadProductDetail = async () => {
    try {
      setLoading(true);
      const result = await MarketplaceService.getProducto(productId);
      
      if (result.success) {
        setProduct(result.data);
        setIsLiked(result.data.is_liked || false);
        setLikesCount(result.data.likes_count || 0); // Agregar esta línea
      } else {
        Alert.alert('Error', 'No se pudo cargar el producto');
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
      router.back();
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

  // Función para contactar al artesano
  const handleContact = () => {
    Alert.alert(
      'Contactar Artesano',
      'Próximamente podrás contactar directamente al artesano a través de chat.',
      [{ text: 'OK' }]
    );
  };

  // Función dar like al producto
const handleLike = async (productID) => {
  try {
    const result = await toggleLikeProduct(productID);
    if (result.success) {
      setIsLiked(result.liked);
      // Usar el contador que viene en la respuesta
      setLikesCount(result.likes_count);
    } else {
      Alert.alert('Error', 'No se pudo marcar como favorito');
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    Alert.alert('Error', 'No se pudo marcar como favorito');
  }
};

  // Función para navegar al perfil del artesano
  const handleArtesanoPress = () => {
    if (product?.artesano?.id) {
      router.push({
        pathname: '/ArtesanoProfile',
        params: { userId: product.artesano.id.toString() }
      });
    }
  };

  // Renderizar el componente
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9D046D" />
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
                color={saved ? "#9D046D" : "#666"}
              />
              <Text style={[styles.actionButtonText, saved && styles.savedButtonText]}>
                {saved ? "Guardado" : "Guardar"}
              </Text>
            </TouchableOpacity>

            {/* Contactar al artesano */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.contactButton]}
              onPress={handleContact}
            >
              <MaterialCommunityIcons name="phone" size={20} color="#fff" />
              <Text style={styles.contactButtonText}>Contactar</Text>
            </TouchableOpacity>

            {/* Compartir */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.shareButton]}
              onPress={() => {
                // Placeholder: implementar compartir (Share API)
                Alert.alert('Compartir', 'Función de compartir próximamente.');
              }}
            >
              <MaterialCommunityIcons name="share-variant-outline" size={20} color="#29297A" />
            </TouchableOpacity>

            {/* Me gusta / like */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.shareButton]}
              onPress={() => handleLike(product.id ?? productId)}
            >
              <MaterialCommunityIcons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={20} 
                color="#FF69B4" 
              />
              <Text style={styles.likeCountText}>{likesCount}</Text>
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
              <MaterialCommunityIcons name="tag-outline" size={16} color="#9D046D" />
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
                {product.artesano.avatar_url ? (
                  <Image 
                    source={{ uri: product.artesano.avatar_url }} 
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
              <MaterialCommunityIcons name="chevron-right" size={24} color="#9D046D" />
            </TouchableOpacity>
          </View>

          {/* Separador */}
          <View style={styles.separator} />

          {/* Ubicación */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            <View style={styles.locationContainer}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#F54927" />
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
    color: '#9D046D',
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
    backgroundColor: '#FBDAF4',
    borderColor: '#9D046D',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  savedButtonText: {
    color: '#9D046D',
  },
  contactButton: {
    flex: 2,
    backgroundColor: '#9D046D',
    borderColor: '#9D046D',
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
    backgroundColor: '#e3f2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 14,
    color: '#9D046D',
    fontWeight: '500',
    marginLeft: 6,
  },
  artesanoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9',
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
    backgroundColor: '#9D046D',
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
    color: '',
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

  likeCountText: {
  fontSize: 14,
  color: '#666',
  marginLeft: 4,
},
});