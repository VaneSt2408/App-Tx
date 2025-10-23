// app/completeProfile.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { createClientProfile } from '../src/services/authService';
import { supabase } from '../src/supabase/client';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import 'react-native-get-random-values';

// --- Componente reutilizable para mostrar y seleccionar el avatar ---
const Avatar = ({ url, onUpload, loading }: { url: string | null; onUpload: () => void; loading: boolean }) => {
  return (
    <TouchableOpacity onPress={onUpload} style={styles.avatarContainer} disabled={loading}>
      {url ? (
        <Image source={{ uri: url }} style={styles.avatarImage} />
      ) : (
        <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
          <Text style={styles.avatarPlaceholderText}>Añadir Foto</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function CompleteProfilePage() {
  const { session, refreshProfile } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería para seleccionar una foto');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true, // ¡Crucial! Pedimos la imagen en formato base64 para poder subirla
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleSubmit = async () => {
    // Validar campos requeridos
    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'El nombre completo es requerido');
      return;
    }

    setLoading(true);
    try {
      // Obtenemos el ID del usuario que ya tiene una sesión activa
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'No se encontró la sesión del usuario');
        return;
      }

      let avatarUrl = null;

      // --- Subida de la imagen (si se seleccionó una) ---
      if (selectedImage) {
        const fileExt = selectedImage.uri.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`; // Guardamos la imagen en una carpeta con el ID del usuario
        
        // Subimos la imagen decodificada al bucket 'avatars'
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, decode(selectedImage.base64), {
            contentType: selectedImage.mimeType ?? 'image/jpeg',
          });

        if (uploadError) {
          Alert.alert('Error', 'No se pudo subir la imagen: ' + uploadError.message);
          return;
        }

        // Si la subida fue exitosa, obtenemos la URL pública de la imagen
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatarUrl = urlData.publicUrl;
      }

      // --- Guardado del perfil en la tabla 'clientes' ---
      const { error: profileError } = await createClientProfile(user.id, formData.fullName, formData.phone, avatarUrl);
      if (profileError) {
        Alert.alert('Error', 'No se pudo completar el perfil: ' + profileError.message);
        return;
      }

      Alert.alert('¡Éxito!', 'Tu perfil ha sido completado.', [
        {
          text: 'Continuar',
          onPress: async () => {
            // Refrescar el perfil en el contexto
            await refreshProfile();
            // La lógica de navegación en _layout.tsx se encargará de redirigir
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar tu perfil. Inténtalo de nuevo. ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Completa tu Perfil</Text>
          <Text style={styles.subtitle}>
            Necesitamos algunos datos adicionales para personalizar tu experiencia
          </Text>
        </View>

        <View style={styles.formSection}>
          {/* Selección de foto */}
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Foto de Perfil (Opcional)</Text>
            <Avatar 
              url={selectedImage?.uri || null} 
              onUpload={handleSelectImage} 
              loading={loading} 
            />
          </View>

          {/* Formulario */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre Completo *</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(value) => handleInputChange('fullName', value)}
              placeholder="Ej: Juan Pérez García"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono (Opcional)</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="Ej: 555-123-4567"
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>
        </View>
      </ScrollView>

      {/* Botón de envío */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Completar Perfil</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: {
    marginBottom: 20,
  },
  imageSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  imageSelector: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 10,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  imagePreview: {
    alignItems: 'center',
  },
  imagePreviewText: {
    color: '#2575fc',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#999',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#2575fc',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos del componente Avatar
  avatarContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#2575fc',
  },
  avatarPlaceholder: {
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#555',
  },
});
