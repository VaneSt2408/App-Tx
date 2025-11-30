// En: components/UploadProductModal.js
// Componente modal para subir un nuevo producto con imagen y detalles. Incluye validaciones y manejo de estado de carga.
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
import { selectMultipleAndCompressImages, createProduct } from '../src/services/productService';

const CATEGORIAS_EJEMPLO = [
  'Textil', 'Alfarería', 'Joyería', 
  'Madera', 'Piel', 'Piedra', 'Vidrio', 
  'Metal', 'Cerámica', 'Cestería', 
  'Fibras', 'Minerales'
];

const UploadProductModal = ({ visible, onClose, onProductUploaded }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
    stock: '',
    min_may: 'minoreo', // minoreo, mayoreo, ambas
  });
  const [manualCategoria, setManualCategoria] = useState('');

  const [selectedImages, setSelectedImages] = useState([]); // Ahora es un array
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectImage = async () => {
    console.log('[UploadProductModal] ==> handleSelectImage: Iniciando selección de imágenes.');
    if (selectedImages.length >= 5) {
      Alert.alert('Límite alcanzado', 'Puedes seleccionar un máximo de 5 imágenes.');
      return;
    }
    try {
      // Usamos la nueva función para selección múltiple
      const imageAssets = await selectMultipleAndCompressImages(5 - selectedImages.length);
      if (imageAssets) {
        console.log('[UploadProductModal] <== handleSelectImage: Imágenes seleccionadas:', imageAssets.length);
        
        // ¡LOG CLAVE! Verificamos el tamaño de cada imagen seleccionada.
        imageAssets.forEach((asset, index) => {
          const sizeInBytes = (asset.base64.length * 3) / 4; // Cálculo aproximado del tamaño en bytes
          const sizeInMB = sizeInBytes / (1024 * 1024);
          console.log(`[UploadProductModal] Tamaño de Imagen ${index + 1}: ${sizeInMB.toFixed(2)} MB`);
        });

        setSelectedImages(prev => [...prev, ...imageAssets].slice(0, 5));
      }
    } catch (error) {
      console.error('[UploadProductModal] Error en handleSelectImage:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleSubmit = async () => {
    console.log('[UploadProductModal] ==> handleSubmit: Iniciando proceso de subida.');
    console.log('[UploadProductModal] Datos del formulario:', formData);
    console.log('[UploadProductModal] Imágenes seleccionadas:', selectedImages.length);

    // Validar campos requeridos
    if (!formData.nombre.trim() || !formData.descripcion.trim() || !formData.precio.trim()) {
      console.log('[UploadProductModal] Validación fallida: Campos de texto requeridos no completados.');
      Alert.alert('Error', 'El precio es requerido');
      return;
    }

    // Validar que el precio sea un número válido
    const precio = parseFloat(formData.precio);
    if (isNaN(precio) || precio <= 0) {
      console.log('[UploadProductModal] Validación fallida: El precio no es un número válido > 0.');
      Alert.alert('Error', 'El precio debe ser un número válido mayor a 0');
      return;
    }

    const stock = parseInt(formData.stock, 10);
    if (isNaN(stock) || stock < 0) {
      console.log('[UploadProductModal] Validación fallida: El stock no es un número válido >= 0.');
      Alert.alert('Error', 'El stock debe ser un número válido igual o mayor a 0');
      return;
    }

    // Nueva validación para el número de imágenes
    if (selectedImages.length < 3) {
      console.log('[UploadProductModal] Validación fallida: Se requieren al menos 3 imágenes.');
      Alert.alert('Imágenes insuficientes', 'Debes seleccionar al menos 3 imágenes.');
      return;
    }

    setLoading(true);
    console.log('[UploadProductModal] Estado de carga activado (loading: true).');
    try {
      // Preparar datos del producto incluyendo la imagen
      const finalCategoria = formData.categoria === 'Otro' 
        ? manualCategoria.trim() 
        : formData.categoria;

      if (!finalCategoria) {
        console.log('[UploadProductModal] Validación fallida: No se especificó una categoría.');
        Alert.alert('Error', 'Debes seleccionar o especificar una categoría');
        setLoading(false);
        return;
      }

      const productPayload = { ...formData, categoria: finalCategoria };
      console.log('[UploadProductModal] ==> createProduct: Llamando al servicio para crear el producto.');
      console.log('[UploadProductModal] Datos enviados a createProduct:', productPayload);

      // Llamamos a la función createProduct con el array de imágenes
      const result = await createProduct(productPayload, selectedImages);
      
      console.log('[UploadProductModal] <== createProduct: Respuesta del servicio:', result);
      Alert.alert('Éxito', 'Producto subido correctamente');
      // Limpiar formulario
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria: '',
        stock: '',
        min_may: 'minoreo',
      });
      setManualCategoria('');
      setSelectedImages([]);
      onClose();
      if (onProductUploaded) {
        onProductUploaded();
      }
    } catch (error) {
      console.error('[UploadProductModal] Error en handleSubmit:', error.message);
      Alert.alert('Error', error.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
      console.log('[UploadProductModal] <== handleSubmit: Proceso finalizado (loading: false).');
    }
  };

  const handleClose = () => {
    if (!loading) {
      console.log('[UploadProductModal] ==> handleClose: Limpiando formulario y cerrando modal.');
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria: '',
        stock: '',
        min_may: 'minoreo',
      });
      setManualCategoria('');
      setSelectedImages([]);
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
              {selectedImages.length > 0 ? (
                <ScrollView horizontal contentContainerStyle={styles.galleryContainer}>
                  {selectedImages.map((image, index) => (
                    <View key={index} style={styles.imagePreviewContainer}>
                      <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                      <TouchableOpacity 
                        style={styles.removeButton} 
                        onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                      >
                        <MaterialCommunityIcons name="close-circle" size={24} color="rgba(0,0,0,0.7)" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialCommunityIcons name="camera-plus" size={40} color="#999" />
                  <Text style={styles.imagePlaceholderText}>Toca para seleccionar (3 a 5 imágenes)</Text>
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
              <Text style={styles.label}>Stock disponible *</Text>
              <TextInput
                style={styles.input}
                value={formData.stock}
                onChangeText={(value) => handleInputChange('stock', value)}
                placeholder="Ej: 10"
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Venta</Text>
              <View style={styles.categoryContainer}>
                {['minoreo', 'mayoreo', 'ambas'].map(tipo => (
                  <TouchableOpacity
                    key={tipo}
                    style={[
                      styles.categoryChip,
                      formData.min_may === tipo && styles.categoryChipSelected
                    ]}
                    onPress={() => handleInputChange('min_may', tipo)}
                    disabled={loading}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      formData.min_may === tipo && styles.categoryChipTextSelected
                    ]}>
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Categoría</Text>
              <View style={styles.categoryContainer}>
                {[...CATEGORIAS_EJEMPLO, 'Otro'].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      formData.categoria === cat && styles.categoryChipSelected
                    ]}
                    onPress={() => handleInputChange('categoria', cat)}
                    disabled={loading}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      formData.categoria === cat && styles.categoryChipTextSelected
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {formData.categoria === 'Otro' && (
                <TextInput
                  style={[styles.input, { marginTop: 10 }]}
                  value={manualCategoria}
                  onChangeText={setManualCategoria}
                  placeholder="Escribe la categoría personalizada"
                  editable={!loading}
                />
              )}
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
  galleryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginRight: 10,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
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
  // Estilos para categorías
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#e9ecef',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  categoryChipSelected: {
    backgroundColor: '#FBDAF4',
    borderColor: '#9D046D',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#495057',
  },
  categoryChipTextSelected: {
    color: '#9D046D',
    fontWeight: 'bold',
  },
});

export default UploadProductModal;
