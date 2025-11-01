// app/completeArtesanoProfile.tsx
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

export default function CompleteArtesanoProfilePage() {
  const { session, refreshProfile } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    descripcion: '',
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
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleSubmit = async () => {
    console.log('📝 [CompleteArtesanoProfile] Iniciando handleSubmit...');
    console.log('📋 [CompleteArtesanoProfile] Datos del formulario:', {
      descripcion: formData.descripcion ? `${formData.descripcion.substring(0, 50)}...` : 'vacío',
      tieneImagen: !!selectedImage
    });

    setLoading(true);
    try {
      // Obtenemos el ID del usuario que ya tiene una sesión activa
      console.log('👤 [CompleteArtesanoProfile] Obteniendo usuario actual...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ [CompleteArtesanoProfile] No se encontró usuario');
        Alert.alert('Error', 'No se encontró la sesión del usuario');
        return;
      }
      console.log('✅ [CompleteArtesanoProfile] Usuario obtenido:', user.id);

      let avatarUrl = null;

      // --- Subida de la imagen (si se seleccionó una) ---
      if (selectedImage) {
        console.log('📤 [CompleteArtesanoProfile] Iniciando subida de imagen...');
        const fileExt = selectedImage.uri.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        console.log('📁 [CompleteArtesanoProfile] Ruta del archivo:', filePath);
        
        // Subimos la imagen decodificada al bucket 'avatars'
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, decode(selectedImage.base64), {
            contentType: selectedImage.mimeType ?? 'image/jpeg',
          });

        if (uploadError) {
          console.error('❌ [CompleteArtesanoProfile] Error al subir imagen:', uploadError);
          Alert.alert('Error', 'No se pudo subir la imagen: ' + uploadError.message);
          return;
        }

        // Si la subida fue exitosa, obtenemos la URL pública de la imagen
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatarUrl = urlData.publicUrl;
        console.log('✅ [CompleteArtesanoProfile] Imagen subida exitosamente:', avatarUrl);
      } else {
        console.log('ℹ️ [CompleteArtesanoProfile] No se seleccionó imagen');
      }

      // --- Actualizar el perfil del artesano ---
      // Primero actualizamos el avatar en la tabla artesanos si existe
      if (avatarUrl) {
        console.log('🔄 [CompleteArtesanoProfile] Actualizando avatar en tabla artesanos...');
        console.log('📊 [CompleteArtesanoProfile] user_id:', user.id, 'avatar_url:', avatarUrl);
        const { error: avatarError } = await supabase
          .from('artesanos')
          .update({ avatar_url: avatarUrl })
          .eq('user_id', user.id);

        if (avatarError) {
          console.error('❌ [CompleteArtesanoProfile] Error actualizando avatar:', avatarError);
          Alert.alert('Error', 'No se pudo actualizar la foto de perfil: ' + avatarError.message);
          return;
        }
        console.log('✅ [CompleteArtesanoProfile] Avatar actualizado en artesanos');
      }

      // Actualizamos la descripción en la tabla artesanos (siempre, aunque esté vacía)
      console.log('🔄 [CompleteArtesanoProfile] Procesando descripción...');
      const descripcionValue = formData.descripcion.trim() || '';
      console.log('📝 [CompleteArtesanoProfile] Descripción a guardar:', descripcionValue ? `${descripcionValue.substring(0, 100)}...` : '(vacía)');
      
      // Actualizamos la descripción en la tabla artesanos
      console.log('🔄 [CompleteArtesanoProfile] Actualizando descripción en tabla artesanos...');
      const { data: updatedData, error: updateError } = await supabase
        .from('artesanos')
        .update({ descripcion: descripcionValue })
        .eq('user_id', user.id)
        .select();

      if (updateError) {
        console.error('❌ [CompleteArtesanoProfile] Error actualizando descripción:', updateError);
        console.error('❌ [CompleteArtesanoProfile] Detalles del error:', JSON.stringify(updateError, null, 2));
        Alert.alert('Error', 'No se pudo actualizar la descripción: ' + updateError.message);
        return;
      }
      console.log('✅ [CompleteArtesanoProfile] Descripción actualizada exitosamente en artesanos:', updatedData);

      console.log('✅ [CompleteArtesanoProfile] Perfil completado exitosamente');
      console.log('🔄 [CompleteArtesanoProfile] Refrescando perfil en contexto...');
      
      // Esperar un momento para que Supabase procese los cambios
      console.log('⏳ [CompleteArtesanoProfile] Esperando 500ms para que Supabase procese los cambios...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refrescar el perfil ANTES de mostrar el alert para asegurar que los datos estén actualizados
      console.log('🔄 [CompleteArtesanoProfile] Llamando a refreshProfile() antes del alert...');
      await refreshProfile();
      console.log('✅ [CompleteArtesanoProfile] refreshProfile() completado');

      // Verificar que los datos se guardaron correctamente
      console.log('🔍 [CompleteArtesanoProfile] Verificando que los datos se guardaron...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('artesanos')
        .select('descripcion')
        .eq('user_id', user.id)
        .single();

      console.log('📊 [CompleteArtesanoProfile] Verificación post-guardado:', {
        tiene_descripcion: !!verifyData?.descripcion,
        descripcion: verifyData?.descripcion ? `${verifyData.descripcion.substring(0, 50)}...` : 'null',
        error: verifyError?.code
      });

      Alert.alert('¡Éxito!', 'Tu perfil ha sido completado.', [
        {
          text: 'Continuar',
          onPress: () => {
            // La lógica de navegación en _layout.tsx se encargará de redirigir
            console.log('✅ [CompleteArtesanoProfile] Usuario presionó continuar');
          }
        }
      ]);
    } catch (error) {
      console.error('❌ [CompleteArtesanoProfile] Error general:', error);
      Alert.alert('Error', 'No se pudo guardar tu perfil. Inténtalo de nuevo. ' + (error as Error).message);
    } finally {
      setLoading(false);
      console.log('🏁 [CompleteArtesanoProfile] handleSubmit finalizado');
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

