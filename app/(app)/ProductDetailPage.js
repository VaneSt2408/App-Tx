// En: app/(app)/ProductDetailPage.js -> Archivo de detalle de producto (Frontend)
// Este archivo es el encargado de mostrar el detalle de un producto en la aplicación.
// Muestra el detalle de un producto registrado en la base de datos y permite guardar el producto, contactar al artesano y compartir el producto.

// Importaciones (Añadir Modal y Linking)
import React, { useState, useEffect, useCallback } from 'react';
import {View,Text as DefaultText,Image,ScrollView,TouchableOpacity,StyleSheet,ActivityIndicator,Alert, RefreshControl, Modal, Linking, Share, Platform} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router'; 
import MarketplaceService from '../../src/services/MarketplaceService';
import { toggleLikeProduct  } from '../../src/services/productService';
import { useAuth } from '../../src/context/AuthContext';
import useCustomFonts from '../../hooks/useFonts';

// Componente principal
export default function ProductDetailPage() {
  const router = useRouter(); // Obtener el router
  const { productId } = useLocalSearchParams(); // Obtener el id del producto
  const [product, setProduct] = useState(null); // Establecer el estado del producto
  const { role } = useAuth(); // Obtener el rol del usuario
  const [loading, setLoading] = useState(true); // Establecer el estado de carga
  const [refreshing, setRefreshing] = useState(false); // Estado para el refresco
  const [saved, setSaved] = useState(false); // Establecer el estado de guardado
  const [isLiked, setIsLiked] = useState(false); // Estado para controlar si el producto tiene like
  const [contactModalVisible, setContactModalVisible] = useState(false); // Estado para el modal de contacto
  const [likesCount, setLikesCount] = useState(0); // Estado para contar los likes
  const [contactInfo, setContactInfo] = useState({ email: null, telefono: null }); // Estado para la info de contacto
  const [loadingContact, setLoadingContact] = useState(false); // Estado para la carga de la info de contacto

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
        setSaved(result.data.is_saved || false); // <-- Actualizar el estado inicial de guardado
        setLikesCount(result.data.likes_count || 0); // Agregar esta línea
      } else {
        Alert.alert('Error', 'No se pudo cargar el producto');
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
      router.back();
    } finally {
      // Asegurarse de que ambos estados de carga se desactiven
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para refrescar la pantalla
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProductDetail();
  }, [productId]);


    // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Handlers para botones (placeholders)
  const handleSave = async () => {
    try {
      // Cambiamos el estado visual inmediatamente para una mejor experiencia de usuario
      setSaved(current => !current);

      const result = await MarketplaceService.toggleSaveProduct(productId);

      if (result.success) {
        // Sincronizamos el estado final con la respuesta del servidor
        setSaved(result.saved);
      } else {
        // Si falla, revertimos el cambio visual y mostramos una alerta
        setSaved(current => !current);
        Alert.alert('Error', result.error || 'No se pudo guardar el producto.');
      }
    } catch (error) {
      setSaved(current => !current); // Revertir si hay una excepción
      Alert.alert('Error', 'Ocurrió un error inesperado al guardar.');
    }
  };

  // Función para contactar al artesano
  const handleContact = async () => {
    console.log('[ProductDetailPage] Botón "Contactar" presionado.');
    if (!product?.artesano?.id) {
        console.log('[ProductDetailPage] No se encontró ID de artesano. Abortando.');
        return;
    }

    console.log(`[ProductDetailPage] Solicitando contacto para el artesano ID: ${product.artesano.id}`);
    setLoadingContact(true);
    setContactModalVisible(true); // Abrir el modal para mostrar el spinner

    const result = await MarketplaceService.getArtesanoContact(product.artesano.id);
    console.log('[ProductDetailPage] Respuesta del servicio de contacto:', JSON.stringify(result, null, 2));

    setLoadingContact(false);

    if (result.success && result.data.telefono) {
      console.log('[ProductDetailPage] Contacto obtenido exitosamente. Mostrando datos:', result.data);
      setContactInfo(result.data);
    } else {
      // Si no hay datos, cerramos el modal y mostramos una alerta.
      console.log('[ProductDetailPage] No se obtuvieron datos de contacto o la operación falló. Mostrando alerta.');
      setContactModalVisible(false);
      Alert.alert(
        'Sin Contacto',
        'El artesano no ha proporcionado información de contacto.',
        [{ text: 'OK' }]
      );
    }
  };

    // Funciones para abrir apps externas
    const openPhone = (telefono) => {
        Linking.openURL(`tel:${telefono}`);
    };

    const openEmail = (email) => {
        Linking.openURL(`mailto:${email}`);
    };

  // Función para compartir el producto (versión de producción)
  const handleShare = async () => {
    if (!product) return;

    // --- ENLACE DE PRODUCCIÓN ---
    // Deberás reemplazar "https://txapp.example.com" con tu dominio real.
    const baseUrl = "https://txapp.example.com";
    const productUrl = `${baseUrl}/producto/${product.id}`;
    const message = `¡Mira este increíble producto que encontré en la app de Artesanos!\n\n${product.nombre}\n\n${productUrl}`;

    try {      
      // Forzamos a que solo se envíe el mensaje para máxima compatibilidad.
      // Algunas apps en Android ignoran el texto si se envía una URL por separado.
      // Al incluir la URL en el mensaje, nos aseguramos de que siempre se muestre.
      await Share.share({
        title: `Producto: ${product.nombre}`, // Título para compartir por email, etc.
        message: message, // El mensaje siempre se incluye.
      });
    } catch (error) {
      if (error.action !== Share.dismissedAction) {
        Alert.alert('Error', 'No se pudo compartir el producto.');
      }
    }
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
        pathname: '/ArtesanoProfileVistaVisitante', // Cambiar a la ruta correcta
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
    <>
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#9D046D']}
          />
        }
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
              name={
                product.estado === 'activo' ? "check-circle" :
                product.estado === 'vendido' ? "cart-off" : "close-circle"
              }
              size={20}
              color={
                product.estado === 'activo' ? "#4caf50" :
                product.estado === 'vendido' ? "#ff9800" : "#f44336"
              }
            />
            <Text style={[
              styles.availabilityText,
              { color: 
                  product.estado === 'activo' ? "#4caf50" :
                  product.estado === 'vendido' ? "#ff9800" : "#f44336"
              }
            ]}>
              {product.estado === 'activo' ? 'Disponible' : 
               product.estado === 'vendido' ? 'Vendido' : 'No Disponible'}
            </Text>
          </View>

          {/* Stock Disponible */}
          {product.estado === 'activo' && product.stock !== null && product.stock > 0 && (
            <View style={styles.availabilityContainer}>
              <MaterialCommunityIcons 
                name="package-variant-closed"
                size={20}
                color="#6200ea"
              />
              <Text style={[styles.availabilityText, { color: "#6200ea" }]}>
                {product.stock} {product.stock === 1 ? 'unidad disponible' : 'unidades disponibles'}
              </Text>
            </View>
          )}

          {/* Tipo de Venta */}
          {product.min_may && (
            <View style={styles.availabilityContainer}>
              <MaterialCommunityIcons 
                name="storefront-outline"
                size={20}
                color="#333"
              />
              <Text style={[styles.availabilityText, { color: "#333" }]}>
                {
                  product.min_may === 'minoreo' ? 'Venta por minoreo' :
                  product.min_may === 'mayoreo' ? 'Venta por mayoreo' :
                  'Venta minorista y mayorista'
                }
              </Text>
            </View>
          )}

          {/* Botones de Acción */}
          <View style={styles.actionsContainer}>
            {role === 'cliente' && (
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
            )}

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
              onPress={handleShare}
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

    {/* Modal de Contacto */}
    <Modal
        animationType="slide"
        transparent={true}
        visible={contactModalVisible}
        onRequestClose={() => setContactModalVisible(false)}
    >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Contactar al Artesano</Text>
                <Text style={styles.modalSubtitle}>{product?.artesano?.nombre}</Text>
                
                {loadingContact ? (
                    <View style={styles.contactLoadingContainer}>
                        <ActivityIndicator size="large" color="#9D046D" />
                        <Text style={styles.contactLoadingText}>Cargando contacto...</Text>
                    </View>
                ) : (
                    <>
                        {contactInfo.telefono && (
                            <TouchableOpacity 
                                style={styles.contactOption}
                                onPress={() => openPhone(contactInfo.telefono)}
                            >
                                <MaterialCommunityIcons name="phone" size={24} color="#9D046D" />
                                <Text style={styles.contactText}>{contactInfo.telefono}</Text>
                            </TouchableOpacity>
                        )}

                    </>
                )}

                {!loadingContact && !contactInfo.telefono && (
                    <Text style={styles.noContactText}>No hay información de contacto disponible.</Text>
                )}

                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setContactModalVisible(false)}
                >
                    <Text style={styles.closeButtonText}>Cerrar</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // ... (tus estilos existentes)
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
  // Estilos para el Modal de Contacto
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  noContactText: {
    fontSize: 16,
    color: '#999',
    marginVertical: 20,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#9D046D',
    fontWeight: '600',
  },
  contactLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLoadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
});