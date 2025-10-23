// En: src/services/productService.js
import { supabase } from '../supabase/client';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// --- Función para seleccionar y comprimir imagen ---
export const selectAndCompressImage = async () => {
  try {
    // Solicitar permisos para acceder a la galería
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería para seleccionar imágenes');
      return null;
    }

    // Configurar opciones del selector de imágenes
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7, // Comprimir a 70% de calidad
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      console.log('Imagen seleccionada:', asset.uri);
      return asset.uri;
    }
    
    return null;
  } catch (error) {
    console.error('Error al seleccionar imagen:', error);
    Alert.alert('Error', 'No se pudo seleccionar la imagen');
    return null;
  }
};

// --- Función para subir imagen a Supabase Storage ---
export const uploadImageToSupabase = async (imageUri, productId) => {
  try {
    console.log('Subiendo imagen a Supabase...');
    
    // Leer el archivo como base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });
    
    if (!base64) {
      throw new Error('No se pudo leer el archivo');
    }
    
    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileName = `producto_${productId}_${timestamp}.jpg`;
    const filePath = `productos/${fileName}`;
    
    // Función para convertir base64 a Uint8Array (compatible con React Native)
    const base64ToUint8Array = (base64) => {
      const binaryString = base64;
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    };
    
    const bytes = base64ToUint8Array(base64);
    
    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from('productos')
      .upload(filePath, bytes, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('Error al subir imagen:', error);
      throw new Error(`Error al subir imagen: ${error.message}`);
    }

    // Obtener URL pública de la imagen
    const { data: urlData } = supabase.storage
      .from('productos')
      .getPublicUrl(filePath);

    console.log('Imagen subida exitosamente:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error en uploadImageToSupabase:', error);
    throw error;
  }
};

// --- Función para crear un nuevo producto ---
export const createProduct = async (productData) => {
  try {
    console.log('Creando producto...', productData);
    
    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No hay sesión activa');
    }

    // Insertar producto en la base de datos
    const { data, error } = await supabase
      .from('productos')
      .insert({
        artesano_id: user.id,
        nombre: productData.nombre,
        descripcion: productData.descripcion,
        precio: productData.precio,
        categoria: productData.categoria || 'general',
        estado: 'activo'
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear producto:', error);
      throw new Error(`Error al crear producto: ${error.message}`);
    }

    console.log('Producto creado exitosamente:', data);
    return data;
  } catch (error) {
    console.error('Error en createProduct:', error);
    throw error;
  }
};

// --- Función para subir imagen y actualizar producto con URL ---
export const updateProductWithImage = async (productId, imageUrl) => {
  try {
    console.log('Actualizando producto con imagen...');
    
    const { error } = await supabase
      .from('productos')
      .update({ imagen_url: imageUrl })
      .eq('id', productId);

    if (error) {
      console.error('Error al actualizar producto con imagen:', error);
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }

    console.log('Producto actualizado con imagen exitosamente');
    return true;
  } catch (error) {
    console.error('Error en updateProductWithImage:', error);
    throw error;
  }
};

// --- Función principal para subir producto completo ---
export const uploadProduct = async (productData, imageUri) => {
  try {
    console.log('Iniciando proceso de subida de producto...');
    
    // 1. Crear el producto en la base de datos
    const product = await createProduct(productData);
    
    // 2. Si hay imagen, subirla y actualizar el producto
    if (imageUri) {
      const imageUrl = await uploadImageToSupabase(imageUri, product.id);
      await updateProductWithImage(product.id, imageUrl);
    }
    
    console.log('Producto subido exitosamente');
    return { success: true, product };
  } catch (error) {
    console.error('Error en uploadProduct:', error);
    return { success: false, error: error.message };
  }
};

// --- Función para obtener productos del artesano ---
export const getArtesanoProducts = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No hay sesión activa');
    }

    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('artesano_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener productos:', error);
      throw new Error(`Error al obtener productos: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error en getArtesanoProducts:', error);
    throw error;
  }
};
