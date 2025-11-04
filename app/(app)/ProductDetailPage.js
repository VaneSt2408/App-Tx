// En: app/(app)/ProductDetailPage.js -> Archivo de detalle de producto (Frontend)
// Este archivo es el encargado de mostrar el detalle de un producto en la aplicación.
// Muestra el detalle de un producto, permite guardarlo, compartirlo y ahora, calificarlo y dejar reseñas.

// Importaciones
import React, { useState, useEffect } from 'react';
import {View,Text,Image,ScrollView,TouchableOpacity,StyleSheet,ActivityIndicator,Alert,TextInput,KeyboardAvoidingView,Platform} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MarketplaceService from '../../src/services/MarketplaceService';

// Componente principal
export default function ProductDetailPage() {
  const router = useRouter(); // Obtener el router
  const { productId } = useLocalSearchParams(); // Obtener el id del producto
  const [product, setProduct] = useState(null); // Establecer el estado del producto
  const [loading, setLoading] = useState(true); // Establecer el estado de carga
  const [saved, setSaved] = useState(false); // Establecer el estado de guardado
  
  // --- NUEVOS ESTADOS PARA RESEÑAS ---
  const [reviews, setReviews] = useState([]); // Para guardar las reseñas del producto
  const [myRating, setMyRating] = useState(0); // Calificación del usuario actual (0 = sin calificar)
  const [myReviewText, setMyReviewText] = useState(''); // Texto de la reseña del usuario
  const [isSubmitting, setIsSubmitting] = useState(false); // Para el estado de carga al enviar reseña

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
        // --- SIMULACIÓN DE CARGA DE RESEÑAS ---
        // En una implementación real, esto vendría del servicio
        const mockReviews = [
          { id: 1, user_name: 'Ana Pérez', rating: 5, comment: '¡Excelente calidad! Me encantó el diseño y los colores. Llegó muy rápido.' },
          { id: 2, user_name: 'Carlos Gómez', rating: 4, comment: 'Muy bonito producto, aunque un poco más pequeño de lo que esperaba. Aún así, lo recomiendo.' },
          { id: 3, user_name: 'Sofía Rodríguez', rating: 5, comment: 'Artesanía de primera. Se nota el cuidado en cada detalle.' },
        ];
        setReviews(mockReviews);
        // -----------------------------------------
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

  // Función para compartir el producto
  const handleShare = () => {
    Alert.alert(
      'Compartir Producto',
      'Próximamente podrás compartir este producto con tus contactos.',
      [{ text: 'OK' }]
    );
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

  // --- NUEVAS FUNCIONES PARA RESEÑAS ---

  // Función para renderizar las estrellas (para input y para mostrar)
  const renderStars = (rating, onStarPress = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const iconName = i <= rating ? 'star' : 'star-outline';
      const starColor = i <= rating ? '#FFC700' : '#ccc';
      
      if (onStarPress) { // Si es para input, se envuelve en un TouchableOpacity
        stars.push(
          <TouchableOpacity key={i} onPress={() => onStarPress(i)} disabled={isSubmitting}>
            <MaterialCommunityIcons name={iconName} size={32} color={starColor} style={styles.star} />
          </TouchableOpacity>
        );
      } else { // Si es solo para mostrar
        stars.push(
          <MaterialCommunityIcons key={i} name={iconName} size={18} color={starColor} style={styles.readOnlyStar} onPress={null} />
        );
      }
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  // Función para manejar el envío de la reseña
  const handleSubmitReview = async () => {
    if (myRating === 0) {
      Alert.alert('Calificación requerida', 'Por favor, selecciona una calificación de estrellas.');
      return;
    }
    if (!myReviewText.trim()) {
      Alert.alert('Comentario requerido', 'Por favor, escribe un comentario sobre el producto.');
      return;
    }

    setIsSubmitting(true);
    try {
      // --- SIMULACIÓN DE LLAMADA AL SERVICIO ---
      // En una implementación real, aquí llamarías a un servicio:
      // await MarketplaceService.submitReview(productId, myRating, myReviewText);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular espera de red

      // Añadir la nueva reseña a la lista (simulación)
      const newReview = {
        id: Math.random(),
        user_name: 'Mi Reseña', // En una app real, obtendrías el nombre del usuario actual
        rating: myRating,
        comment: myReviewText,
      };
      setReviews(prev => [newReview, ...prev]);
      
      // Limpiar el formulario
      setMyRating(0);
      setMyReviewText('');

      Alert.alert('¡Gracias!', 'Tu reseña ha sido publicada.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar tu reseña. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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
                name={saved ? "heart" : "heart-outline"}
                size={20}
                color={saved ? "#9D046D" : "#666"}
              />
              <Text style={[styles.actionButtonText, saved && styles.savedButtonText]}>
                {saved ? "Guardado" : "Guardar"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.shareButton]}
              onPress={handleShare}
            >
              <MaterialCommunityIcons name="share-variant" size={20} color="#fff" />
              <Text style={styles.contactButtonText}>Compartir</Text>
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
              <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Separador */}
          <View style={styles.separator} />

          {/* --- NUEVA SECCIÓN DE RESEÑAS --- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calificaciones y Reseñas</Text>

            {/* Formulario para dejar una reseña */}
            <View style={styles.reviewForm}>
              <Text style={styles.reviewFormTitle}>Deja tu calificación</Text>
              {renderStars(myRating, setMyRating)}
              <TextInput
                style={styles.reviewInput}
                placeholder="Escribe tu opinión sobre este producto..."
                placeholderTextColor="#999"
                multiline
                value={myReviewText}
                onChangeText={setMyReviewText}
                editable={!isSubmitting}
              />
              <TouchableOpacity 
                style={[styles.submitReviewButton, isSubmitting && styles.submitReviewButtonDisabled]}
                onPress={handleSubmitReview}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitReviewButtonText}>Enviar Reseña</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Lista de reseñas existentes */}
            {reviews.length > 0 && (
              <View style={styles.reviewsList}>
                {reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewUserName}>{review.user_name}</Text>
                      {renderStars(review.rating)}
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          {/* --- FIN DE LA SECCIÓN DE RESEÑAS --- */}

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
    </KeyboardAvoidingView>
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
    backgroundColor: 'rgba(157, 4, 109, 0.1)',
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
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  shareButton: {
    flex: 2,
    backgroundColor: '#81049D',
    borderColor: '#81049D',
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
    backgroundColor: 'rgba(157, 4, 109, 0.1)',
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
  // --- NUEVOS ESTILOS PARA RESEÑAS ---
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    marginHorizontal: 4,
  },
  readOnlyStar: {
    marginHorizontal: 1,
  },
  reviewForm: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reviewFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  reviewInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    marginTop: 16,
    marginBottom: 12,
  },
  submitReviewButton: {
    backgroundColor: '#9D046D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitReviewButtonDisabled: {
    backgroundColor: '#aaa',
  },
  submitReviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewsList: {
    marginTop: 16,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUserName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});