// En: src/services/productService.js
import { supabase } from '../supabase/client';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// --- Función para seleccionar y comprimir imagen (siguiendo la lógica de completeProfile) ---
export const selectAndCompressImage = async () => {
  try {
    // Solicitar permisos para acceder a la galería
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería para seleccionar imágenes');
      return null;
    }

    // Configurar opciones del selector de imágenes (igual que en completeProfile)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3], // Mantenemos aspect ratio para productos
      quality: 0.5, // Misma compresión que completeProfile
      base64: true, // ¡Crucial! Pedimos la imagen en formato base64 para poder subirla
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      console.log('Imagen seleccionada:', asset.uri);
      return asset; // Retornamos el objeto completo con base64
    }
    
    return null;
  } catch (error) {
    console.error('Error al seleccionar imagen:', error);
    Alert.alert('Error', 'No se pudo seleccionar la imagen');
    return null;
  }
};

// --- Función para subir imagen a Supabase Storage (siguiendo la lógica de completeProfile) ---
export const uploadImageToSupabase = async (imageAsset, productId) => {
  try {
    console.log('Subiendo imagen a Supabase...');
    
    if (!imageAsset || !imageAsset.base64) {
      throw new Error('No se encontró la imagen o los datos base64');
    }
    
    // Obtener el usuario actual para crear la estructura de carpetas
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No se encontró la sesión del usuario');
    }
    
    // Generar nombre único para el archivo (igual que en completeProfile)
    const fileExt = imageAsset.uri.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`; // Guardamos la imagen en una carpeta con el ID del usuario
    
    // Importar decode desde base64-arraybuffer (igual que en completeProfile)
    const { decode } = require('base64-arraybuffer');
    
    // Subimos la imagen decodificada al bucket 'productos' (igual que en completeProfile)
    const { error: uploadError } = await supabase.storage
      .from('productos')
      .upload(filePath, decode(imageAsset.base64), {
        contentType: imageAsset.mimeType ?? 'image/jpeg',
      });

    if (uploadError) {
      console.error('Error al subir imagen:', uploadError);
      throw new Error(`Error al subir imagen: ${uploadError.message}`);
    }

    // Si la subida fue exitosa, obtenemos la URL pública de la imagen
    const { data: urlData } = supabase.storage.from('productos').getPublicUrl(filePath);
    
    console.log('Imagen subida exitosamente:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error en uploadImageToSupabase:', error);
    throw error;
  }
};

// --- Función para crear un nuevo producto (siguiendo la lógica de completeProfile) ---
export const createProduct = async (productData) => {
  try {
    console.log('Creando producto...', productData);
    
    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No hay sesión activa');
    }

    let imagenUrl = null;

    // --- Subida de la imagen (si se proporcionó) ---
    if (productData.imageAsset) {
      console.log('Subiendo imagen del producto...');
      imagenUrl = await uploadImageToSupabase(productData.imageAsset, null);
    }

    // Insertar producto en la base de datos con la URL de la imagen
    const { data, error } = await supabase
      .from('productos')
      .insert({
        artesano_id: user.id,
        nombre: productData.nombre,
        descripcion: productData.descripcion,
        precio: productData.precio,
        categoria: productData.categoria || 'general',
        imagen_url: imagenUrl,
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
