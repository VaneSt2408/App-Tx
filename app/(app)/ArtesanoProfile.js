import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  TextInput
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { artesanoService } from '../../src/services/artesanoService';
import { supabase } from '../../src/supabase/client';
import { useAuth } from '../../src/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

const { width } = Dimensions.get('window');
const imageSize = (width - 60) / 3; // Para grid de 3 columnas

export default function ArtesanoProfile() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const { session } = useAuth();
  
  const [artesano, setArtesano] = useState(null);
  const [publicaciones, setPublicaciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('publicaciones'); // 'publicaciones' o 'productos'
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [editData, setEditData] = useState({ nombre: '', telefono: '', ubicacion: '', descripcion: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const isOwnProfile = session?.user?.id === userId;

  useEffect(() => {
    if (userId) {
      loadArtesanoCompleto();
    }
  }, [userId]);

  const loadArtesanoCompleto = async () => {
    try {
      setLoading(true);
      const data = await artesanoService.getArtesanoCompleto(userId);
      setArtesano(data.artesano);
      setPublicaciones(data.publicaciones);
      setProductos(data.productos);
      
      // Cargar datos para edición
      if (isOwnProfile && data.artesano) {
        setEditData({
          nombre: data.artesano.nombre || '',
          telefono: data.artesano.telefono || '',
          ubicacion: data.artesano.ubicacion || '',
          descripcion: data.artesano.descripcion || ''
        });
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil del artesano');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async () => {
    try {
      const { error } = await supabase
        .from('artesanos')
        .update({
          nombre: editData.nombre,
          telefono: editData.telefono,
          ubicacion: editData.ubicacion,
          descripcion: editData.descripcion
        })
        .eq('user_id', userId);

      if (error) throw error;

      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setShowEditModal(false);
      await loadArtesanoCompleto();
    } catch (error) {
      console.error('Error al editar perfil:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      Alert.alert(
        'Éxito',
        'Contraseña actualizada. Serás redirigido al login.',
        [{
          text: 'OK',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)');
          }
        }]
      );
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      Alert.alert('Error', 'No se pudo cambiar la contraseña');
    }
  };

  const handleDeleteProfile = () => {
    Alert.alert(
      'Eliminar Perfil',
      '¿Estás seguro de que deseas eliminar tu perfil? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Eliminar productos
              await supabase
                .from('productos')
                .delete()
                .eq('artesano_id', userId);

              // Eliminar publicaciones
              await supabase
                .from('publicaciones')
                .delete()
                .eq('artesano_user_id', userId);

              // Eliminar perfil de artesano
              await supabase
                .from('artesanos')
                .delete()
                .eq('user_id', userId);

              Alert.alert(
                'Perfil Eliminado',
                'Tu perfil ha sido eliminado. Serás redirigido al login.',
                [{
                  text: 'OK',
                  onPress: async () => {
                    await supabase.auth.signOut();
                    router.replace('/(auth)');
                  }
                }]
              );
            } catch (error) {
              console.error('Error al eliminar perfil:', error);
              Alert.alert('Error', 'No se pudo eliminar el perfil');
            }
          }
        }
      ]
    );
  };

  const selectAvatarImage = async () => {
    try {
      // Cerrar el modal
      setShowAvatarMenu(false);
      
      // Pequeño delay para que el modal se cierre antes de abrir la galería
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos necesarios', 'Se requiere acceso a la galería para cambiar la foto de perfil');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadAvatarImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen: ' + error.message);
    }
  };

  const uploadAvatarImage = async (imageAsset) => {
    try {
      setUploadingAvatar(true);

      const fileExt = imageAsset.uri.split('.').pop();
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(imageAsset.base64), {
          contentType: imageAsset.mimeType ?? 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('artesanos')
        .update({ avatar_url: urlData.publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      setArtesano(prev => ({ ...prev, avatar_url: urlData.publicUrl }));
      Alert.alert('Éxito', 'Foto de perfil actualizada correctamente');
    } catch (error) {
      console.error('Error al subir avatar:', error);
      Alert.alert('Error', 'No se pudo actualizar la foto de perfil');
    } finally {
      setUploadingAvatar(false);
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
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.editModalContainer}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Cambiar Contraseña</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.editModalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nueva Contraseña</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirmar Contraseña</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                />
              </View>
            </View>

            <View style={styles.editModalFooter}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleChangePassword}
              >
                <Text style={styles.saveButtonText}>Cambiar Contraseña</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
