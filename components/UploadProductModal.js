// En: components/UploadProductModal.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { selectAndCompressImage, uploadProduct } from '../src/services/productService';

const UploadProductModal = ({ visible, onClose, onProductUploaded }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: 'general',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectImage = async () => {
    try {
      const imageUri = await selectAndCompressImage();
      if (imageUri) {
        setSelectedImage(imageUri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleSubmit = async () => {
    // Validar campos requeridos
    if (!formData.nombre.trim()) {
      Alert.alert('Error', 'El nombre del producto es requerido');
      return;
    }
    if (!formData.descripcion.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }
    if (!formData.precio.trim()) {
      Alert.alert('Error', 'El precio es requerido');
      return;
    }

    // Validar que el precio sea un número válido
    const precio = parseFloat(formData.precio);
    if (isNaN(precio) || precio <= 0) {
      Alert.alert('Error', 'El precio debe ser un número válido mayor a 0');
      return;
    }

    setLoading(true);
    try {
      const result = await uploadProduct(formData, selectedImage);
      
      if (result.success) {
        Alert.alert('Éxito', 'Producto subido correctamente');
        // Limpiar formulario
        setFormData({
          nombre: '',
          descripcion: '',
          precio: '',
          categoria: 'general',
        });
        setSelectedImage(null);
        onClose();
        if (onProductUploaded) {
          onProductUploaded();
        }
      } else {
        Alert.alert('Error', result.error || 'No se pudo subir el producto');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria: 'general',
      });
      setSelectedImage(null);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={loading}>
            <MaterialCommunityIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subir Producto</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Selección de imagen */}
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Imagen del Producto</Text>
            <TouchableOpacity 
              style={styles.imageSelector} 
              onPress={handleSelectImage}
              disabled={loading}
            >
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialCommunityIcons name="camera-plus" size={40} color="#999" />
                  <Text style={styles.imagePlaceholderText}>Toca para seleccionar imagen</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Formulario */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Información del Producto</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del Producto *</Text>
              <TextInput
                style={styles.input}
                value={formData.nombre}
                onChangeText={(value) => handleInputChange('nombre', value)}
                placeholder="Ej: Jarro de barro tradicional"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.descripcion}
                onChangeText={(value) => handleInputChange('descripcion', value)}
                placeholder="Describe tu producto..."
                multiline
                numberOfLines={4}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Precio (MXN) *</Text>
              <TextInput
                style={styles.input}
                value={formData.precio}
                onChangeText={(value) => handleInputChange('precio', value)}
                placeholder="Ej: 150.00"
                keyboardType="numeric"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Categoría</Text>
              <TextInput
                style={styles.input}
                value={formData.categoria}
                onChangeText={(value) => handleInputChange('categoria', value)}
                placeholder="Ej: cerámica, textiles, madera"
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
              <>
                <MaterialCommunityIcons name="upload" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Subir Producto</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
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
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
  formSection: {
    marginBottom: 20,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#2575fc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
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
    marginLeft: 8,
  },
});

export default UploadProductModal;
