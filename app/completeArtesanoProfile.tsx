  // En: app/completeArtesanoProfile.tsx -> Archivo de perfil del artesano (Frontend)
  // Este archivo es el encargado de mostrar el formulario de perfil del artesano en la aplicación.
  // Permite completar el perfil del artesano mediante un formulario de perfil.

// Importaciones
import React, { useState } from 'react';
import {View,Text,TextInput,TouchableOpacity,StyleSheet,Alert,ActivityIndicator,ScrollView,KeyboardAvoidingView,Platform ,Image,} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { completeArtesanoProfile } from '../src/services/userService';
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

// Componente principal
export default function CompleteArtesanoProfilePage() {
  const { session, refreshProfile } = useAuth(); // Obtener el contexto de autenticación
  const router = useRouter(); // Obtener el router
  const [formData, setFormData] = useState({ // Establecer el estado del formulario
    descripcion: '', // Establecer el estado de la descripción
  });
  const [selectedImage, setSelectedImage] = useState<any>(null); // Establecer el estado de la imagen seleccionada
  const [loading, setLoading] = useState(false); // Establecer el estado de carga

  // Función para manejar el cambio de input
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para seleccionar la imagen
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
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async () => {
    setLoading(true);
    try {
      
      const result = await completeArtesanoProfile(
        { descripcion: formData.descripcion },
        selectedImage || null
      );

      if (result.success) {
        
        // Esperar un momento para que Supabase procese los cambios
        await new Promise(resolve => setTimeout(resolve, 500));

        // Refrescar el perfil ANTES de mostrar el alert para asegurar que los datos estén actualizados
        await refreshProfile();

        Alert.alert('¡Éxito!', 'Tu perfil ha sido completado.', [
          {
            text: 'Continuar',
            onPress: () => {
              // La lógica de navegación en _layout.tsx se encargará de redirigir
            }
          }
        ]);
      }
    } catch (error) {
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
            Agrega información adicional para mejorar tu presencia en la plataforma
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
            <Text style={styles.label}>Descripción (Opcional)</Text>
            <Text style={styles.hint}>
              Cuéntanos sobre ti, tu trabajo y tus productos. Esto ayudará a los clientes a conocerte mejor.
            </Text>
            <TextInput
              style={styles.textArea}
              value={formData.descripcion}
              onChangeText={(value) => handleInputChange('descripcion', value)}
              placeholder="Ej: Artesano especializado en cerámica tradicional, con más de 10 años de experiencia..."
              multiline
              numberOfLines={6}
              maxLength={500}
              editable={!loading}
            />
            <Text style={styles.characterCount}>
              {formData.descripcion.length}/500 caracteres
            </Text>
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
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
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
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

