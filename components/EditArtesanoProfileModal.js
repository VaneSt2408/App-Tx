// components/EditArtesanoProfileModal.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updatePerfilArtesanoCompleto } from '../src/services/ArtesanoProfileService';

export default function EditArtesanoProfileModal({ visible, onClose, artesano, onProfileUpdate }) {
  const [editData, setEditData] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (artesano) {
      setEditData({
        nombre: artesano.nombre || '',
        telefono: artesano.telefono || '',
        ubicacion: artesano.ubicacion || '',
        descripcion: artesano.descripcion || '',
        link_ubicacion: artesano.link_ubicacion || '',
        avatar_url: artesano.avatar_url || null,
      });
    }
  }, [artesano, visible]);

  const handleSelectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos necesarios', 'Se requiere acceso a la galería para cambiar la foto.');
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
      setEditData(prev => ({ ...prev, avatar_url: result.assets[0].uri }));
    }
  };

  const handleSaveChanges = async () => {
    if (!artesano?.user_id) return;
    setUploading(true);
    try {
      const result = await updatePerfilArtesanoCompleto(artesano.user_id, editData, selectedImage);
      if (!result.success) {
        throw new Error(result.error);
      }
      Alert.alert('Éxito', 'Perfil actualizado correctamente.');
      onProfileUpdate(); // Llama a la función para refrescar y cerrar
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el perfil.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.editModalContainer}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={handleClose}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalBody} keyboardShouldPersistTaps="handled">
              {/* Avatar Section */}
              <View style={styles.avatarEditSection}>
                <Text style={styles.inputLabel}>Foto de perfil</Text>
                <TouchableOpacity
                  style={styles.avatarButton}
                  onPress={handleSelectImage}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#666" />
                  ) : editData.avatar_url ? (
                    <Image source={{ uri: editData.avatar_url }} style={styles.avatarPreview} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <MaterialCommunityIcons name="camera" size={30} color="rgba(157, 4, 109,0.25)" />
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.changeAvatarButton}
                  onPress={handleSelectImage}
                  disabled={uploading}
                >
                  <MaterialCommunityIcons name="camera-plus" size={20} color="#9D046D" />
                  <Text style={styles.changeAvatarButtonText}>
                    {uploading ? 'Subiendo...' : 'Cambiar foto'}
                  </Text>
                </TouchableOpacity>
              </View>

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
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ubicación (ej. Ciudad, Estado)</Text>
                <TextInput
                  style={styles.input}
                  value={editData.ubicacion}
                  onChangeText={(text) => setEditData({ ...editData, ubicacion: text })}
                  placeholder="Oaxaca, México"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Enlace de Google Maps</Text>
                <TextInput
                  style={styles.input}
                  value={editData.link_ubicacion}
                  onChangeText={(text) => setEditData({ ...editData, link_ubicacion: text })}
                  placeholder="https://maps.app.goo.gl/..."
                  keyboardType="url"
                  autoCapitalize="none"
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
                style={[styles.saveButton, uploading && { backgroundColor: '#ccc' }]}
                onPress={handleSaveChanges}
                disabled={uploading}
              >
                {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  editModalContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  editModalContent: { backgroundColor: '#fff', borderRadius: 20, maxHeight: '90%', width: '90%', overflow: 'hidden' },
  editModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  editModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  editModalBody: { padding: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  editModalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  saveButton: { backgroundColor: '#9D046D', padding: 16, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  avatarEditSection: { marginBottom: 20, alignItems: 'center' },
  avatarButton: { marginBottom: 12 },
  avatarPreview: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#9D046D' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#9D046D' },
  changeAvatarButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  changeAvatarButtonText: { marginLeft: 8, fontSize: 14, color: '#9D046D', fontWeight: '600' },
});
