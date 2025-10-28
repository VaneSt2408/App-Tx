// En: app/(app)/ArtesanoProfile.js -> Archivo del perfil del artesano (Frontend) 
// Este archivo es el encargado de mostrar el perfil del artesano en la aplicación.
// Muestra el perfil del artesano registrado en la base de datos y permite editarlo, cambiar la contraseña, eliminar el perfil y cambiar la foto de perfil.

import React, { useState, useEffect } from 'react'; // Importar los hooks de react
import {View,Text,StyleSheet,ScrollView,Image,TouchableOpacity,SafeAreaView,ActivityIndicator,Alert,Dimensions,FlatList,Modal,TextInput} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Importar los componentes de expo-vector-icons
import { useRouter, useLocalSearchParams } from 'expo-router'; // Importar el router de expo-router
import { artesanoService } from '../../src/services/artesanoService'; // Importar el servicio de artesano
import { supabase } from '../../src/supabase/client'; // Importar el cliente de supabase
import { useAuth } from '../../src/context/AuthContext'; // Importar el contexto de autenticación
import * as ImagePicker from 'expo-image-picker'; // Importar el selector de imágenes
import { updatePerfilArtesano, eliminarPerfilArtesano, subirAvatarArtesano } from '../../src/services/ArtesanoProfileService'; // Importar los servicios de perfil
import ChangePasswordModal from '../../components/ChangePasswordModal'; // Importar el modal de cambio de contraseña

const { width } = Dimensions.get('window'); // Obtener el ancho de la ventana
const imageSize = (width - 60) / 3; // Para grid de 3 columnas

export default function ArtesanoProfile() { // Exportar la función ArtesanoProfile
  const router = useRouter(); // Obtener el router
  const { userId } = useLocalSearchParams(); // Obtener el id del usuario
  const { session } = useAuth(); // Obtener la sesión
  
  const [artesano, setArtesano] = useState(null); // Establecer el estado del artesano
  const [publicaciones, setPublicaciones] = useState([]); // Establecer el estado de las publicaciones
  const [productos, setProductos] = useState([]); // Establecer el estado de los productos
  const [loading, setLoading] = useState(true); // Establecer el estado de carga
  const [activeTab, setActiveTab] = useState('publicaciones'); // 'publicaciones' o 'productos'
  const [showSettingsMenu, setShowSettingsMenu] = useState(false); // Establecer el estado del menú de ajustes
  const [showEditModal, setShowEditModal] = useState(false); // Establecer el estado del modal de edición
  const [showPasswordModal, setShowPasswordModal] = useState(false); // Establecer el estado del modal de cambio de contraseña
  const [showAvatarMenu, setShowAvatarMenu] = useState(false); // Establecer el estado del modal de cambio de foto de perfil
  const [editData, setEditData] = useState({ nombre: '', telefono: '', ubicacion: '', descripcion: '' }); // Establecer el estado de los datos de edición
  const [uploadingAvatar, setUploadingAvatar] = useState(false); // Establecer el estado de subida de foto de perfil
  const isOwnProfile = session?.user?.id === userId; // Verificar si el usuario es el propio

  useEffect(() => { // Efecto para cargar el perfil del artesano
    if (userId) { // Si hay id de usuario
      loadArtesanoCompleto(); // Cargar el perfil del artesano
    }
  }, [userId]); // Dependencias del efecto

  const loadArtesanoCompleto = async () => { // Función para cargar el perfil del artesano
    try {
      setLoading(true); // Establecer el estado de carga
      const data = await artesanoService.getArtesanoCompleto(userId); // Cargar el perfil del artesano
      setArtesano(data.artesano); // Establecer el estado del artesano
      setPublicaciones(data.publicaciones); // Establecer el estado de las publicaciones
      setProductos(data.productos); // Establecer el estado de los productos
      
      // Cargar datos para edición
      if (isOwnProfile && data.artesano) { // Si el usuario es el propio y hay datos del artesano
        setEditData({ nombre: data.artesano.nombre || '', telefono: data.artesano.telefono || '', ubicacion: data.artesano.ubicacion || '', descripcion: data.artesano.descripcion || '' }); // Establecer el estado de los datos de edición
      }
    } catch (error) { // Capturar el error
      console.error('Error al cargar perfil:', error); // Mostrar el error en la consola
      Alert.alert('Error', 'No se pudo cargar el perfil del artesano'); // Mostrar el error en la alerta
      router.back(); // Redirigir a la página anterior
    } finally { // Finalmente
      setLoading(false); // Establecer el estado de carga
    }
  };

  const handleEditProfile = async () => { // Función para editar el perfil del artesano
    try {
      const result = await updatePerfilArtesano(userId, editData);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setShowEditModal(false); // Establecer el estado del modal de edición
      await loadArtesanoCompleto(); // Cargar el perfil del artesano
    } catch (error) { // Capturar el error
      console.error('Error al editar perfil:', error); // Mostrar el error en la consola
      Alert.alert('Error', 'No se pudo actualizar el perfil'); // Mostrar el error en la alerta
    }
  };

  const handlePasswordChangeSuccess = () => { // Función para redirigir al login después de cambiar contraseña
    // Redirigir al login después de cambiar contraseña
    router.replace('/(auth)'); // Redirigir al login
  };

  const handleDeleteProfile = () => { // Función para eliminar el perfil del artesano
    Alert.alert( // Mostrar el alert de eliminación de perfil
      'Eliminar Perfil',
      '¿Estás seguro de que deseas eliminar tu perfil? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' }, // Texto del botón de cancelar
        {
          text: 'Eliminar', // Texto del botón de eliminar
          style: 'destructive', // Estilo del botón de eliminar
          onPress: async () => {
            try { // Intentar eliminar el perfil del artesano
              const result = await eliminarPerfilArtesano(userId);

              if (!result.success) {
                throw new Error(result.error);
              }

              Alert.alert( // Mostrar el alert de eliminación de perfil
                'Perfil Eliminado', // Texto del alert de eliminación de perfil
                'Tu perfil ha sido eliminado. Serás redirigido al login.', // Texto del alert de eliminación de perfil
                [{
                  text: 'OK', // Texto del botón de OK
                  onPress: async () => {
                    await supabase.auth.signOut(); // Cerrar la sesión
                    router.replace('/(auth)'); // Redirigir al login
                  }
                }]
              );
            } catch (error) { // Capturar el error
              console.error('Error al eliminar perfil:', error); // Mostrar el error en la consola
              Alert.alert('Error', 'No se pudo eliminar el perfil'); // Mostrar el error en la alerta
            }
          }
        }
      ]
    );
  };

  const selectAvatarImage = async () => { // Función para seleccionar la imagen de perfil
    try {
      // Cerrar el modal
      setShowAvatarMenu(false); // Establecer el estado del modal de cambio de foto de perfil
      
      // Pequeño delay para que el modal se cierre antes de abrir la galería
      await new Promise(resolve => setTimeout(resolve, 300)); // Esperar 300ms
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync(); // Solicitar permisos para acceder a la galería
      if (status !== 'granted') { // Si no hay permisos
        Alert.alert('Permisos necesarios', 'Se requiere acceso a la galería para cambiar la foto de perfil'); // Mostrar el alert de permisos necesarios
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({ // Abrir el selector de imágenes
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Tipo de media: imágenes
        allowsEditing: true, // Permitir edición
        aspect: [1, 1], // Aspecto cuadrado
        quality: 0.5, // Calidad de la imagen
        base64: true, // Convertir a base64
      });

      if (!result.canceled && result.assets && result.assets[0]) { // Si no se canceló y hay assets y el primer asset
        await uploadAvatarImage(result.assets[0]); // Subir la imagen de perfil
      }
    } catch (error) { // Capturar el error
      console.error('Error al seleccionar imagen:', error); // Mostrar el error en la consola
      Alert.alert('Error', 'No se pudo seleccionar la imagen: ' + error.message); // Mostrar el error en la alerta
    }
  };

  const uploadAvatarImage = async (imageAsset) => { // Función para subir la imagen de perfil
    try {
      setUploadingAvatar(true); // Establecer el estado de subida de foto de perfil

      const result = await subirAvatarArtesano(userId, imageAsset);

      if (!result.success) {
        throw new Error(result.error);
      }

      setArtesano(prev => ({ ...prev, avatar_url: result.avatar_url })); // Establecer el estado del artesano
      Alert.alert('Éxito', 'Foto de perfil actualizada correctamente');
    } catch (error) { // Capturar el error
      console.error('Error al subir avatar:', error); // Mostrar el error en la consola
      Alert.alert('Error', 'No se pudo actualizar la foto de perfil'); // Mostrar el error en la alerta
    } finally { // Finalmente
      setUploadingAvatar(false); // Establecer el estado de subida de foto de perfil
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        {isOwnProfile ? (
          <TouchableOpacity onPress={() => setShowSettingsMenu(true)} style={styles.backButton}>
            <MaterialCommunityIcons name="cog-outline" size={24} color="#333" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );

  const renderProfileInfo = () => (
    <View style={styles.profileSection}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {isOwnProfile ? (
            <TouchableOpacity
              onPress={() => setShowAvatarMenu(true)}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <View style={styles.defaultAvatar}>
                  <ActivityIndicator size="small" color="#666" />
                </View>
              ) : (
                <>
                  {artesano?.avatar_url ? (
                    <View style={styles.avatarWrapper}>
                      <Image source={{ uri: artesano.avatar_url }} style={styles.avatar} />
                      <View style={styles.avatarEditOverlay}>
                        <MaterialCommunityIcons name="camera" size={20} color="#fff" />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.defaultAvatar}>
                      <MaterialCommunityIcons name="account" size={60} color="#666" />
                      <View style={styles.avatarEditIcon}>
                        <MaterialCommunityIcons name="camera" size={16} color="#666" />
                      </View>
                    </View>
                  )}
                </>
              )}
            </TouchableOpacity>
          ) : (
            <>
              {artesano?.avatar_url ? (
                <Image source={{ uri: artesano.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.defaultAvatar}>
                  <MaterialCommunityIcons name="account" size={60} color="#666" />
                </View>
              )}
            </>
          )}
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{publicaciones.length}</Text>
            <Text style={styles.statLabel}>Publicaciones</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{productos.length}</Text>
            <Text style={styles.statLabel}>Productos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{artesano?.total_likes || 0}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>
      </View>

      <View style={styles.profileInfo}>
        <Text style={styles.nombre}>{artesano?.nombre || 'No definido'}</Text>
        <Text style={styles.folio}>Folio: {artesano?.folio || 'No definido'}</Text>
        
        {artesano?.ubicacion && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
            <Text style={styles.infoText}>{artesano.ubicacion}</Text>
          </View>
        )}
        
        {artesano?.categoria && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="tag" size={16} color="#666" />
            <Text style={styles.infoText}>{artesano.categoria}</Text>
          </View>
        )}
        
        {artesano?.telefono && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="phone" size={16} color="#666" />
            <Text style={styles.infoText}>{artesano.telefono}</Text>
          </View>
        )}

        {artesano?.descripcion && (
          <Text style={styles.descripcion}>{artesano.descripcion}</Text>
        )}
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'publicaciones' && styles.activeTab]}
        onPress={() => setActiveTab('publicaciones')}
      >
        <MaterialCommunityIcons 
          name="image-multiple" 
          size={20} 
          color={activeTab === 'publicaciones' ? '#177eaaff' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'publicaciones' && styles.activeTabText]}>
          Publicaciones
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'productos' && styles.activeTab]}
        onPress={() => setActiveTab('productos')}
      >
        <MaterialCommunityIcons 
          name="package-variant" 
          size={20} 
          color={activeTab === 'productos' ? '#177eaaff' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'productos' && styles.activeTabText]}>
          Productos
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPublicacion = ({ item }) => (
    <View style={styles.gridItem}>
      {item.imagen_url ? (
        <Image source={{ uri: item.imagen_url }} style={styles.gridImage} />
      ) : (
        <View style={styles.placeholderImage}>
          <MaterialCommunityIcons name="image" size={30} color="#ccc" />
        </View>
      )}
      <View style={styles.overlay}>
        <View style={styles.overlayContent}>
          <MaterialCommunityIcons name="heart" size={16} color="#fff" />
          <Text style={styles.overlayText}>{item.likes_count || 0}</Text>
        </View>
      </View>
    </View>
  );

  const renderProducto = ({ item }) => (
    <View style={styles.gridItem}>
      {item.imagen_url ? (
        <Image source={{ uri: item.imagen_url }} style={styles.gridImage} />
      ) : (
        <View style={styles.placeholderImage}>
          <MaterialCommunityIcons name="package" size={30} color="#ccc" />
        </View>
      )}
      <View style={styles.overlay}>
        <View style={styles.overlayContent}>
          <MaterialCommunityIcons name="currency-usd" size={16} color="#fff" />
          <Text style={styles.overlayText}>{item.precio ? `$${item.precio}` : 'N/A'}</Text>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    if (activeTab === 'publicaciones') {
      return (
        <FlatList
          data={publicaciones}
          renderItem={renderPublicacion}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="image-multiple-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No hay publicaciones</Text>
            </View>
          )}
        />
      );
    } else {
      return (
        <FlatList
          data={productos}
          renderItem={renderProducto}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="package-variant-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No hay productos</Text>
            </View>
          )}
        />
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#177eaaff" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!artesano) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={60} color="#ccc" />
          <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <View style={styles.contentContainer}>
        {renderProfileInfo()}
        {renderTabs()}
        {renderContent()}
      </View>

      {/* Modal de Menú de Ajustes */}
      <Modal
        visible={showSettingsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettingsMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSettingsMenu(false)}
        >
          <View style={styles.settingsMenu}>
            <TouchableOpacity
              style={styles.settingsMenuItem}
              onPress={() => {
                setShowSettingsMenu(false);
                setShowEditModal(true);
              }}
            >
              <MaterialCommunityIcons name="pencil" size={24} color="#333" />
              <Text style={styles.settingsMenuText}>Editar Perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsMenuItem}
              onPress={() => {
                setShowSettingsMenu(false);
                setShowPasswordModal(true);
              }}
            >
              <MaterialCommunityIcons name="lock-reset" size={24} color="#333" />
              <Text style={styles.settingsMenuText}>Cambiar Contraseña</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingsMenuItem, styles.deleteItem]}
              onPress={() => {
                setShowSettingsMenu(false);
                handleDeleteProfile();
              }}
            >
              <MaterialCommunityIcons name="delete" size={24} color="#dc3545" />
              <Text style={[styles.settingsMenuText, styles.deleteText]}>Eliminar Perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsMenuClose}
              onPress={() => setShowSettingsMenu(false)}
            >
              <Text style={styles.settingsMenuCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Editar Perfil */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.editModalContainer}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={editData.nombre}
                  onChangeText={(text) => setEditData({ ...editData, nombre: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Teléfono</Text>
                <TextInput
                  style={styles.input}
                  value={editData.telefono}
                  onChangeText={(text) => setEditData({ ...editData, telefono: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ubicación</Text>
                <TextInput
                  style={styles.input}
                  value={editData.ubicacion}
                  onChangeText={(text) => setEditData({ ...editData, ubicacion: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editData.descripcion}
                  onChangeText={(text) => setEditData({ ...editData, descripcion: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            <View style={styles.editModalFooter}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleEditProfile}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Cambiar Contraseña */}
      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordChangeSuccess}
      />

      {/* Modal de Menú de Avatar */}
      <Modal
        visible={showAvatarMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAvatarMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAvatarMenu(false)}
        >
          <View style={styles.avatarMenu}>
            <TouchableOpacity
              style={styles.avatarMenuItem}
              onPress={selectAvatarImage}
            >
              <MaterialCommunityIcons name="camera" size={24} color="#333" />
              <Text style={styles.avatarMenuText}>Cambiar foto de perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarMenuClose}
              onPress={() => setShowAvatarMenu(false)}
            >
              <Text style={styles.avatarMenuCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  contentContainer: {
    flex: 1,
  },
  profileSection: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
  },
  defaultAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  profileInfo: {
    marginTop: 10,
  },
  nombre: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  folio: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  descripcion: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginTop: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#177eaaff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#177eaaff',
    fontWeight: 'bold',
  },
  gridContainer: {
    padding: 2,
  },
  gridItem: {
    width: imageSize,
    height: imageSize,
    margin: 1,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  // Estilos para Modales
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  settingsMenu: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  settingsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deleteItem: {
    borderBottomColor: '#ffebee',
  },
  settingsMenuText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  deleteText: {
    color: '#dc3545',
  },
  settingsMenuClose: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
  },
  settingsMenuCloseText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  editModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editModalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#177eaaff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos para Avatar Editable
  avatarWrapper: {
    position: 'relative',
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  avatarMenu: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  avatarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarMenuText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  avatarMenuClose: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
  },
  avatarMenuCloseText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});
