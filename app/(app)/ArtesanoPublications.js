// En: app/(app)/ArtesanoPublications.js -> Archivo de las publicaciones del artesano (Frontend)
// Este archivo es el encargado de mostrar las publicaciones del artesano en la aplicación.
// Muestra las publicaciones del artesano registradas en la base de datos y permite buscarlas por texto, fecha o categoría.
// También permite navegar al perfil del artesano y ver su información completa.


// Importaciones
import React, { useState, useEffect } from 'react';
import {View,Text,FlatList,Image,TouchableOpacity,StyleSheet,ActivityIndicator,RefreshControl,Alert,Dimensions,Modal,ScrollView,TextInput,PanResponder,Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { getPublicacionesByArtesano, deletePublication, updatePublication } from '../../src/services/PublicacionService';

const { width } = Dimensions.get('window'); // Obtener el ancho de la ventana
const imageSize = (width - 60) / 3; // Para grid de 3 columnas

// Componente principal
export default function ArtesanoPublications() {
  const router = useRouter(); // Obtener el router
  const { userId } = useLocalSearchParams(); // Obtener el id del usuario
  const { session } = useAuth(); // Obtener la sesión
  const [publicaciones, setPublicaciones] = useState([]); // Establecer el estado de las publicaciones
  const [loading, setLoading] = useState(true); // Establecer el estado de carga
  const [refreshing, setRefreshing] = useState(false); // Establecer el estado de refresco
  const [currentPage, setCurrentPage] = useState(0); // Establecer el estado de la página actual
  const [hasMore, setHasMore] = useState(true); // Establecer el estado de si hay más publicaciones
  const [totalCount, setTotalCount] = useState(0); // Establecer el estado del total de publicaciones
  const [selectedPublication, setSelectedPublication] = useState(null); // Establecer el estado de la publicación seleccionada
  const [selectedIndex, setSelectedIndex] = useState(0); // Establecer el estado del índice de la publicación seleccionada
  const [showPublicationModal, setShowPublicationModal] = useState(false); // Establecer el estado de la publicación modal
  const [showEditModal, setShowEditModal] = useState(false); // Establecer el estado de la modal de edición
  const [editData, setEditData] = useState({ texto: '' }); // Establecer el estado de los datos de edición
  const [editLoading, setEditLoading] = useState(false); // Establecer el estado de carga de edición
  const swipeAnim = React.useRef(new Animated.Value(0)).current; // Referencia para la animación del swipe
  const isOwnProfile = session?.user?.id === userId; // Verificar si el usuario es el propio

  // Efecto para cargar las publicaciones
  useEffect(() => {
    if (userId) {
      loadPublicaciones();
    }
  }, [userId]);

  // Función para cargar las publicaciones
  const loadPublicaciones = async (page = 0) => {
    try {
      if (page === 0) {
        setLoading(true);
      }
      const result = await getPublicacionesByArtesano(userId, 20, page);
      if (result.success) {
        if (page === 0) {
          setPublicaciones(result.data);
        } else {
          setPublicaciones(prev => [...prev, ...result.data]);
        }
        setHasMore(result.hasMore);
        setCurrentPage(page);
        setTotalCount(result.totalCount || 0);
      } else {
        Alert.alert('Error', 'No se pudieron cargar las publicaciones');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para refrescar las publicaciones
  const onRefresh = () => {
    setRefreshing(true);
    loadPublicaciones(0);
  };

  // Función para cargar más publicaciones
  const loadMore = () => {
    if (hasMore && !loading) {
      loadPublicaciones(currentPage + 1);
    }
  };

  // Función para seleccionar una publicación
  const handleSelectPublication = (publication, index) => {
    setSelectedPublication(publication);
    setSelectedIndex(index);
    setShowPublicationModal(true);
  };

  // Función para cerrar el modal de publicación
  const handleCloseModal = () => {
    setShowPublicationModal(false);
    setSelectedPublication(null);
    setSelectedIndex(0);
    swipeAnim.setValue(0);
  };

  // Función para navegar a la siguiente publicación
  const handleNextPublication = () => {
    if (selectedIndex < publicaciones.length - 1) {
      const nextIndex = selectedIndex + 1;
      setSelectedIndex(nextIndex);
      setSelectedPublication(publicaciones[nextIndex]);
      swipeAnim.setValue(0);
    }
  };

  // Función para navegar a la publicación anterior
  const handlePreviousPublication = () => {
    if (selectedIndex > 0) {
      const prevIndex = selectedIndex - 1;
      setSelectedIndex(prevIndex);
      setSelectedPublication(publicaciones[prevIndex]);
      swipeAnim.setValue(0);
    }
  };

  // PanResponder para gestos de deslizamiento
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, vx } = gestureState;
        // Deslizar hacia la izquierda (siguiente)
        if (dx < -50 || vx < -0.5) {
          handleNextPublication();
        }
        // Deslizar hacia la derecha (anterior)
        else if (dx > 50 || vx > 0.5) {
          handlePreviousPublication();
        } else {
          // Resetear animación si no se alcanzó el umbral
          Animated.spring(swipeAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        swipeAnim.setValue(gestureState.dx);
      },
    })
  ).current;

  // Función para eliminar una publicación
  const handleDeletePublication = async (publicacionId) => {
    Alert.alert(
      'Eliminar Publicación',
      '¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.',
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
              const result = await deletePublication(publicacionId);
              
              if (result.success) {
                Alert.alert('Éxito', 'Publicación eliminada correctamente');
                // Cerrar modal y recargar las publicaciones
                handleCloseModal();
                loadPublicaciones(0);
              } else {
                Alert.alert('Error', result.error || 'No se pudo eliminar la publicación');
              }
            } catch (error) {
              Alert.alert('Error', 'Ocurrió un error al eliminar la publicación');
            }
          }
        }
      ]
    );
  };

  // Función para editar una publicación
  const handleEditPublication = () => {
    if (selectedPublication) {
      setEditData({ texto: selectedPublication.texto || '' });
      setShowEditModal(true);
      // No cerrar el modal de detalles inmediatamente
    } else {
    }
  };

  // Función para cerrar el modal de edición
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditData({ texto: '' });
  };

  // Función para guardar la edición de una publicación
  const handleSaveEdit = async () => {
    if (!selectedPublication) return;
    setEditLoading(true);
    try {
      await updatePublication(selectedPublication.id, { texto: editData.texto });
      Alert.alert('Éxito', 'Publicación editada correctamente');
      handleCloseEditModal();
      handleCloseModal();
      // Recargar las publicaciones
      loadPublicaciones(0);
    } catch (error) {
      Alert.alert('Error', error.message || 'Ocurrió un error al editar la publicación');
    } finally {
      setEditLoading(false);
    }
  };

  // Función para formatear la fecha de una publicación
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

  // Función para renderizar una publicación
  const renderPublication = ({ item, index }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => handleSelectPublication(item, index)}
      activeOpacity={0.7}
    >
      {item.imagen_url ? (
        <Image source={{ uri: item.imagen_url }} style={styles.gridImage} />
      ) : (
        <View style={styles.placeholderImage}>
          <MaterialCommunityIcons name="image" size={30} color="#ccc" />
        </View>
      )}
      
      {/* Overlay con información */}
      <View style={styles.overlay}>
        <View style={styles.overlayContent}>
          <MaterialCommunityIcons name="heart" size={14} color="#fff" />
          <Text style={styles.overlayText}>{item.likes_count || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Función para renderizar el footer
  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2575fc" />
      </View>
    );
  };

  // Función para renderizar el contenido vacío
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="image-multiple-outline" size={80} color="#ccc" />
      <Text style={styles.emptyText}>
        {isOwnProfile ? 'No tienes publicaciones aún' : 'No hay publicaciones'}
      </Text>
      <Text style={styles.emptySubtext}>
        {isOwnProfile 
          ? 'Crea tu primera publicación para compartir tu trabajo'
          : 'Este artesano aún no ha compartido publicaciones'
        }
      </Text>
      {isOwnProfile && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/CreatePostPage')}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Crear Publicación</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && publicaciones.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2575fc" />
        <Text style={styles.loadingText}>Cargando publicaciones...</Text>
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
            {isOwnProfile ? 'Mis Publicaciones' : 'Publicaciones'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {totalCount} {totalCount === 1 ? 'publicación' : 'publicaciones'}
          </Text>
        </View>
        {isOwnProfile && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/CreatePostPage')}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#2575fc" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={publicaciones}
        renderItem={renderPublication}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={publicaciones.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
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
      />

      {/* Modal de detalles de publicación */}
      <Modal
        visible={showPublicationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent} {...panResponder.panHandlers}>
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                {selectedIndex > 0 && (
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={handlePreviousPublication}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={24} color="#333" />
                  </TouchableOpacity>
                )}
                <Text style={styles.modalTitle}>
                  Publicación {selectedIndex + 1} de {publicaciones.length}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCloseModal}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Animated.View 
              style={[
                styles.modalBody,
                {
                  transform: [{ translateX: swipeAnim }],
                  opacity: swipeAnim.interpolate({
                    inputRange: [-200, 0, 200],
                    outputRange: [0.5, 1, 0.5],
                  }),
                },
              ]}
            >
            <ScrollView>
              {selectedPublication && (
                <>
                  {/* Imagen */}
                  {selectedPublication.imagen_url ? (
                    <Image 
                      source={{ uri: selectedPublication.imagen_url }} 
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.modalImagePlaceholder}>
                      <MaterialCommunityIcons name="image" size={60} color="#ccc" />
                    </View>
                  )}

                  {/* Información */}
                  <View style={styles.modalInfo}>
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="heart" size={20} color="#e91e63" />
                      <Text style={styles.infoLabel}>Likes:</Text>
                      <Text style={styles.infoValue}>{selectedPublication.likes_count || 0}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="calendar" size={20} color="#2196f3" />
                      <Text style={styles.infoLabel}>Fecha:</Text>
                      <Text style={styles.infoValue}>{formatDate(selectedPublication.created_at)}</Text>
                    </View>

                    {/* Texto de la publicación */}
                    {selectedPublication.texto && (
                      <View style={styles.textSection}>
                        <Text style={styles.textLabel}>Descripción:</Text>
                        <Text style={styles.textContent}>{selectedPublication.texto}</Text>
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
                style={[styles.navButton, selectedIndex === 0 && styles.navButtonDisabled]}
                onPress={handlePreviousPublication}
                disabled={selectedIndex === 0}
              >
                <MaterialCommunityIcons 
                  name="chevron-left" 
                  size={24} 
                  color={selectedIndex === 0 ? '#ccc' : '#333'} 
                />
                <Text style={[styles.navButtonText, selectedIndex === 0 && styles.navButtonTextDisabled]}>
                  Anterior
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, selectedIndex === publicaciones.length - 1 && styles.navButtonDisabled]}
                onPress={handleNextPublication}
                disabled={selectedIndex === publicaciones.length - 1}
              >
                <Text style={[styles.navButtonText, selectedIndex === publicaciones.length - 1 && styles.navButtonTextDisabled]}>
                  Siguiente
                </Text>
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={24} 
                  color={selectedIndex === publicaciones.length - 1 ? '#ccc' : '#333'} 
                />
              </TouchableOpacity>
            </View>

            {/* Botones de acción */}
            {isOwnProfile && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    if (selectedPublication) {
                      setEditData({ texto: selectedPublication.texto || '' });
                      setShowPublicationModal(false); // Cerrar modal de detalles
                      setShowEditModal(true); // Abrir modal de edición
                    } else {
                      Alert.alert('Error', 'No hay publicación seleccionada');
                    }
                  }}
                >
                  <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePublication(selectedPublication?.id)}
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
              <Text style={styles.modalTitle}>Editar Publicación</Text>
              <TouchableOpacity onPress={handleCloseEditModal}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Campo de texto editable */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Descripción:</Text>
                <TextInput
                  style={styles.editTextInput}
                  placeholder="¿Qué estás pensando?"
                  placeholderTextColor="#000"
                  multiline
                  value={editData.texto}
                  onChangeText={(text) => setEditData({ texto: text })}
                  maxLength={500}
                />
                <Text style={styles.characterCount}>
                  {editData.texto.length}/500 caracteres
                </Text>
              </View>

              {/* Nota sobre la imagen */}
              <View style={styles.noteSection}>
                <MaterialCommunityIcons name="information" size={20} color="#666" />
                <Text style={styles.noteText}>
                  Nota: La imagen no se puede editar. Si necesitas cambiar la imagen, elimina esta publicación y crea una nueva.
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

  thumbnailDeleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(220, 53, 69, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
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
  },
  editLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  editTextInput: {
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
});
