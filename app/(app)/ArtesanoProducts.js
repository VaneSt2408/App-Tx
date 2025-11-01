// En: app/(app)/ArtesanoProducts.js -> Archivo de los productos del artesano (Frontend)
// Este archivo es el encargado de mostrar los productos del artesano en la aplicación.
// Muestra los productos del artesano registrados en la base de datos y permite buscarlos por nombre, categoría o ubicación.
// También permite navegar al perfil del artesano y ver su información completa.

// Importaciones
import React, { useState, useEffect } from 'react';
import {View,Text,FlatList,Image,TouchableOpacity,StyleSheet,ActivityIndicator,RefreshControl,Alert,Dimensions,Modal,ScrollView,PanResponder,Animated,TextInput,} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { artesanoService } from '../../src/services/artesanoService';
import { updateProduct, deleteProduct } from '../../src/services/productService';
import { supabase } from '../../src/supabase/client';
import * as ImagePicker from 'expo-image-picker';
import UploadProductModal from '../../components/UploadProductModal';


// Constantes
const { width } = Dimensions.get('window'); // Obtener el ancho de la ventana
const imageSize = (width - 60) / 3; // Para grid de 3 columnas

// Componente principal
export default function ArtesanoProducts() {
  const router = useRouter(); // Router de expo-router para navegar entre pantallas
  const { userId } = useLocalSearchParams(); // Obtener el id del usuario
  const { session } = useAuth(); // Obtener la sesión
  
  const [productos, setProductos] = useState([]); // Estado para guardar los productos
  const [loading, setLoading] = useState(true); // Estado para guardar el estado de carga
  const [refreshing, setRefreshing] = useState(false); // Estado para guardar el estado de refresco
  const [selectedProducto, setSelectedProducto] = useState(null); // Estado para guardar el producto seleccionado
  const [selectedProductoIndex, setSelectedProductoIndex] = useState(0); // Estado para guardar el índice del producto seleccionado
  const [showProductoModal, setShowProductoModal] = useState(false); // Estado para guardar el estado del modal de producto
  const [showEditModal, setShowEditModal] = useState(false); // Estado para guardar el estado del modal de edición
  const [editData, setEditData] = useState({ nombre: '', precio: '', categoria: '', descripcion: '', imagen_url: '' }); // Estado para guardar los datos de edición
  const [selectedImage, setSelectedImage] = useState(null); // Estado para guardar la imagen seleccionada
  const [editLoading, setEditLoading] = useState(false); // Estado para guardar el estado de carga de edición
  const [showUploadModal, setShowUploadModal] = useState(false); // Estado para guardar el estado del modal de subida de producto
  const productoSliderAnim = React.useRef(new Animated.Value(0)).current; // Referencia para la animación del slider de productos

  const isOwnProfile = session?.user?.id === userId; // Verificar si el usuario es el propio

  // Efecto para cargar los productos
  useEffect(() => {
    if (userId) {
      loadProductos();
    }
  }, [userId]);

  // Función para cargar los productos
  const loadProductos = async () => {
    try {
      setLoading(true);
      console.log('📦 [PRODUCTOS] Cargando productos del artesano:', userId);
      
      const productosData = await artesanoService.getProductosByArtesano(userId);
      
      if (productosData) {
        setProductos(productosData);
        console.log('✅ [PRODUCTOS] Productos cargados:', productosData.length);
      } else {
        setProductos([]);
      }
    } catch (error) {
      console.error('❌ [PRODUCTOS] Error al cargar:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
      setProductos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  // Función para refrescar los productos
  const onRefresh = () => {
    setRefreshing(true);
    loadProductos();
  };

  // Función para seleccionar un producto
  const handleSelectProducto = (producto, index) => {
    setSelectedProducto(producto);
    setSelectedProductoIndex(index);
    setShowProductoModal(true);
  };

  // Función para cerrar el modal de producto
  const handleCloseProductoModal = () => {
    setShowProductoModal(false);
    setSelectedProducto(null);
    setSelectedProductoIndex(0);
    productoSliderAnim.setValue(0);
  };

  // Función para navegar al siguiente producto
  const handleNextProducto = () => {
    if (selectedProductoIndex < productos.length - 1) {
      const nextIndex = selectedProductoIndex + 1;
      setSelectedProductoIndex(nextIndex);
      setSelectedProducto(productos[nextIndex]);
      productoSliderAnim.setValue(0);
    }
  };

  // Función para navegar al anterior producto
  const handlePreviousProducto = () => {
    if (selectedProductoIndex > 0) {
      const prevIndex = selectedProductoIndex - 1;
      setSelectedProductoIndex(prevIndex);
      setSelectedProducto(productos[prevIndex]);
      productoSliderAnim.setValue(0);
    }
  };

  // PanResponder para gestos de deslizamiento de productos
  const productoPanResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, vx } = gestureState;
        
        // Deslizar hacia la izquierda (siguiente)
        if (dx < -50 || vx < -0.5) {
          handleNextProducto();
        }
        // Deslizar hacia la derecha (anterior)
        else if (dx > 50 || vx > 0.5) {
          handlePreviousProducto();
        } else {
          // Resetear animación si no se alcanzó el umbral
          Animated.spring(productoSliderAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        productoSliderAnim.setValue(gestureState.dx);
      },
    })
  ).current;


  // Función para editar un producto
  const handleEditProducto = () => {
    if (selectedProducto) {
      setEditData({ 
        nombre: selectedProducto.nombre || '', 
        precio: selectedProducto.precio?.toString() || '', 
        categoria: selectedProducto.categoria || '', 
        descripcion: selectedProducto.descripcion || '',
        imagen_url: selectedProducto.imagen_url || ''
      });
      setSelectedImage(null);
      setShowEditModal(true);
    }
  };

  // Función para seleccionar una imagen de producto
  const selectProductImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos necesarios', 'Se requiere acceso a la galería para cambiar la imagen del producto');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0]);
        setEditData(prev => ({
          ...prev,
          imagen_url: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen: ' + error.message);
    }
  };


  // Función para cerrar el modal de edición
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditData({ nombre: '', precio: '', categoria: '', descripcion: '', imagen_url: '' });
    setSelectedImage(null);
  };

  // Función para guardar la edición del producto
  const handleSaveEdit = async () => {
    if (!selectedProducto) return;

    setEditLoading(true);
    try {
      console.log('✏️ [PRODUCTOS] Editando producto:', selectedProducto.id);
      
      const updateData = {
        nombre: editData.nombre,
        precio: editData.precio,
        categoria: editData.categoria,
        descripcion: editData.descripcion,
      };

      await updateProduct(selectedProducto.id, updateData, selectedImage);

      Alert.alert('Éxito', 'Producto editado correctamente');
      handleCloseEditModal();
      handleCloseProductoModal();
      // Recargar los productos
      loadProductos();
      
    } catch (error) {
      console.error('❌ [PRODUCTOS] Error en handleSaveEdit:', error);
      Alert.alert('Error', error.message || 'Ocurrió un error al editar el producto');
    } finally {
      setEditLoading(false);
    }
  };

  // Función para eliminar un producto
  const handleDeleteProducto = async (productoId) => {
    Alert.alert(
      'Eliminar Producto',
      '¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ [PRODUCTOS] Eliminando producto:', productoId);
              
              await deleteProduct(productoId);

              Alert.alert('Éxito', 'Producto eliminado correctamente');
              handleCloseProductoModal();
              // Recargar los productos
              loadProductos();
              
            } catch (error) {
              console.error('❌ [PRODUCTOS] Error al eliminar:', error);
              Alert.alert('Error', error.message || 'Ocurrió un error al eliminar el producto');
            }
          }
        }
      ]
    );
  };

  // Función para formatear el precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para renderizar un producto en la lista
  const renderProducto = ({ item, index }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => handleSelectProducto(item, index)}
      activeOpacity={0.7}
    >
      {item.imagen_url ? (
        <Image source={{ uri: item.imagen_url }} style={styles.gridImage} />
      ) : (
        <View style={styles.placeholderImage}>
          <MaterialCommunityIcons name="package" size={30} color="#ccc" />
        </View>
      )}
      
      {/* Overlay con precio */}
      <View style={styles.overlay}>
        <View style={styles.overlayContent}>
          <MaterialCommunityIcons name="currency-usd" size={14} color="#fff" />
          <Text style={styles.overlayText}>{item.precio ? formatPrice(item.precio) : 'N/A'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="package-variant-outline" size={80} color="#ccc" />
      <Text style={styles.emptyText}>
        {isOwnProfile ? 'No tienes productos aún' : 'No hay productos'}
      </Text>
      <Text style={styles.emptySubtext}>
        {isOwnProfile 
          ? 'Agrega tu primer producto para empezar a vender'
          : 'Este artesano aún no ha agregado productos'
        }
      </Text>
      {isOwnProfile && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowUploadModal(true)}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Agregar Producto</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && productos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2575fc" />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {isOwnProfile ? 'Mis Productos' : 'Productos'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
          </Text>
        </View>
        {isOwnProfile && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowUploadModal(true)}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#2575fc" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={productos}
        renderItem={renderProducto}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={productos.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2575fc']}
            tintColor="#2575fc"
          />
        }
      />

      {/* Modal de detalles de producto */}
      <Modal
        visible={showProductoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseProductoModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent} {...productoPanResponder.panHandlers}>
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                {selectedProductoIndex > 0 && (
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={handlePreviousProducto}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={24} color="#333" />
                  </TouchableOpacity>
                )}
                <Text style={styles.modalTitle}>
                  Producto {selectedProductoIndex + 1} de {productos.length}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCloseProductoModal}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Animated.View 
              style={[
                styles.modalBody,
                {
                  transform: [{ translateX: productoSliderAnim }],
                  opacity: productoSliderAnim.interpolate({
                    inputRange: [-200, 0, 200],
                    outputRange: [0.5, 1, 0.5],
                  }),
                },
              ]}
            >
            <ScrollView>
              {selectedProducto && (
                <>
                  {/* Imagen */}
                  {selectedProducto.imagen_url ? (
                    <Image 
                      source={{ uri: selectedProducto.imagen_url }} 
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.modalImagePlaceholder}>
                      <MaterialCommunityIcons name="package" size={60} color="#ccc" />
                    </View>
                  )}

                  {/* Información */}
                  <View style={styles.modalInfo}>
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="tag" size={20} color="#2575fc" />
                      <Text style={styles.infoLabel}>Nombre:</Text>
                      <Text style={styles.infoValue}>{selectedProducto.nombre || 'Sin nombre'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="currency-usd" size={20} color="#28a745" />
                      <Text style={styles.infoLabel}>Precio:</Text>
                      <Text style={styles.infoValue}>{formatPrice(selectedProducto.precio)}</Text>
                    </View>

                    {selectedProducto.categoria && (
                      <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="tag-outline" size={20} color="#ff9800" />
                        <Text style={styles.infoLabel}>Categoría:</Text>
                        <Text style={styles.infoValue}>{selectedProducto.categoria}</Text>
                      </View>
                    )}

                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="calendar" size={20} color="#2196f3" />
                      <Text style={styles.infoLabel}>Fecha:</Text>
                      <Text style={styles.infoValue}>{formatDate(selectedProducto.created_at)}</Text>
                    </View>

                    {/* Descripción */}
                    {selectedProducto.descripcion && (
                      <View style={styles.textSection}>
                        <Text style={styles.textLabel}>Descripción:</Text>
                        <Text style={styles.textContent}>{selectedProducto.descripcion}</Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
            </Animated.View>

            {/* Botones de navegación */}
            <View style={styles.modalNavigation}>
              <TouchableOpacity
                style={[styles.navButton, selectedProductoIndex === 0 && styles.navButtonDisabled]}
                onPress={handlePreviousProducto}
                disabled={selectedProductoIndex === 0}
              >
                <MaterialCommunityIcons 
                  name="chevron-left" 
                  size={24} 
                  color={selectedProductoIndex === 0 ? '#ccc' : '#333'} 
                />
                <Text style={[styles.navButtonText, selectedProductoIndex === 0 && styles.navButtonTextDisabled]}>
                  Anterior
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, selectedProductoIndex === productos.length - 1 && styles.navButtonDisabled]}
                onPress={handleNextProducto}
                disabled={selectedProductoIndex === productos.length - 1}
              >
                <Text style={[styles.navButtonText, selectedProductoIndex === productos.length - 1 && styles.navButtonTextDisabled]}>
                  Siguiente
                </Text>
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={24} 
                  color={selectedProductoIndex === productos.length - 1 ? '#ccc' : '#333'} 
                />
              </TouchableOpacity>
            </View>

            {/* Botones de acción */}
            {isOwnProfile && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    if (selectedProducto) {
                      setEditData({ 
                        nombre: selectedProducto.nombre || '', 
                        precio: selectedProducto.precio?.toString() || '', 
                        categoria: selectedProducto.categoria || '', 
                        descripcion: selectedProducto.descripcion || '' 
                      });
                      setShowProductoModal(false);
                      setShowEditModal(true);
                    }
                  }}
                >
                  <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteProducto(selectedProducto?.id)}
                >
                  <MaterialCommunityIcons name="delete" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de edición */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseEditModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Producto</Text>
              <TouchableOpacity onPress={handleCloseEditModal}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Sección de imagen */}
              <View style={styles.imageEditSection}>
                <Text style={styles.editLabel}>Imagen del producto</Text>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={selectProductImage}
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <View style={styles.imagePreview}>
                      <ActivityIndicator size="small" color="#666" />
                      <Text style={styles.uploadingText}>Procesando...</Text>
                    </View>
                  ) : (editData.imagen_url && editData.imagen_url.startsWith('file://')) || selectedImage ? (
                    // Mostrar nueva imagen seleccionada (vista previa local)
                    <Image source={{ uri: selectedImage?.uri || editData.imagen_url }} style={styles.imagePreview} />
                  ) : selectedProducto?.imagen_url ? (
                    // Mostrar imagen actual del producto
                    <Image source={{ uri: selectedProducto.imagen_url }} style={styles.imagePreview} />
                  ) : (
                    // Sin imagen
                    <View style={styles.imagePlaceholder}>
                      <MaterialCommunityIcons name="camera" size={30} color="#666" />
                      <Text style={styles.imagePlaceholderText}>Sin imagen</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={selectProductImage}
                  disabled={editLoading}
                >
                  <MaterialCommunityIcons name="camera-plus" size={20} color="#177eaaff" />
                  <Text style={styles.changeImageButtonText}>
                    {editLoading ? 'Procesando...' : 'Cambiar imagen'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Campo de nombre */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Nombre *</Text>
                <TextInput
                  style={styles.editTextInput}
                  placeholder="Nombre del producto"
                  placeholderTextColor="#000"
                  value={editData.nombre}
                  onChangeText={(text) => setEditData({ ...editData, nombre: text })}
                  maxLength={100}
                />
              </View>

              {/* Campo de precio */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Precio *</Text>
                <TextInput
                  style={styles.editTextInput}
                  placeholder="0.00"
                  placeholderTextColor="#000"
                  value={editData.precio}
                  onChangeText={(text) => setEditData({ ...editData, precio: text })}
                  keyboardType="numeric"
                />
              </View>

              {/* Campo de categoría */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Categoría</Text>
                <TextInput
                  style={styles.editTextInput}
                  placeholder="Categoría del producto"
                  placeholderTextColor="#000"
                  value={editData.categoria}
                  onChangeText={(text) => setEditData({ ...editData, categoria: text })}
                  maxLength={50}
                />
              </View>

              {/* Campo de descripción */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Descripción</Text>
                <TextInput
                  style={styles.editTextArea}
                  placeholder="Descripción del producto"
                  placeholderTextColor="#000"
                  multiline
                  value={editData.descripcion}
                  onChangeText={(text) => setEditData({ ...editData, descripcion: text })}
                  maxLength={500}
                />
                <Text style={styles.characterCount}>
                  {editData.descripcion.length}/500 caracteres
                </Text>
              </View>
            </ScrollView>

            {/* Botones de acción */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCloseEditModal}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, editLoading && styles.disabledButton]}
                onPress={handleSaveEdit}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Guardar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de subir producto */}
      <UploadProductModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onProductUploaded={() => {
          setShowUploadModal(false);
          loadProductos();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    padding: 8,
  },
  list: {
    padding: 8,
    paddingTop: 0,
    paddingBottom: 80,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
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
    marginBottom: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2575fc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  gridItem: {
    width: imageSize,
    height: imageSize,
    margin: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopLeftRadius: 8,
  },
  overlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  // Estilos del modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    maxHeight: 400,
  },
  modalImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  modalImagePlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInfo: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
    marginRight: 10,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  textSection: {
    marginTop: 10,
  },
  textLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textContent: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  modalNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 5,
  },
  navButtonTextDisabled: {
    color: '#ccc',
  },
  // Estilos para botones de acción
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196f3',
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Estilos del modal de edición
  editSection: {
    padding: 20,
    paddingBottom: 0,
  },
  editLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  editTextInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  editTextArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  noteSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 5,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 5,
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  // Estilos para edición de imagen
  imageEditSection: {
    padding: 20,
    paddingBottom: 10,
  },
  imageButton: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  uploadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#e3f2fd',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  changeImageButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#177eaaff',
    fontWeight: '600',
  },
});

