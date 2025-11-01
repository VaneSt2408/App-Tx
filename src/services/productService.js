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

// --- Función para subir imagen de producto para edición ---
export const uploadProductImageForEdit = async (imageAsset, oldImageUrl) => {
  try {
    console.log('📤 [SERVICE] Subiendo imagen del producto para edición...');

    if (!imageAsset.base64) {
      throw new Error('No se encontró la imagen o los datos base64');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No se encontró la sesión del usuario');
    }

    const { decode } = require('base64-arraybuffer');
    const fileExt = imageAsset.uri.split('.').pop();
    const fileName = `producto_${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Eliminar imagen anterior si existe
    if (oldImageUrl) {
      try {
        const urlParts = oldImageUrl.split('/');
        const oldFileName = urlParts[urlParts.length - 1];
        const oldFilePath = `${user.id}/${oldFileName}`;
        
        await supabase.storage
          .from('productos')
          .remove([oldFilePath]);
        
        console.log('🗑️ [SERVICE] Imagen anterior eliminada');
      } catch (error) {
        console.log('⚠️ [SERVICE] No se pudo eliminar la imagen anterior:', error);
      }
    }

    // Subir nueva imagen
    const { error: uploadError } = await supabase.storage
      .from('productos')
      .upload(filePath, decode(imageAsset.base64), {
        contentType: imageAsset.mimeType ?? 'image/jpeg',
      });

    if (uploadError) {
      console.error('❌ [SERVICE] Error al subir imagen:', uploadError);
      throw new Error('Error al subir la imagen: ' + uploadError.message);
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage.from('productos').getPublicUrl(filePath);
    console.log('✅ [SERVICE] Imagen subida correctamente:', urlData.publicUrl);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ [SERVICE] Error en uploadProductImageForEdit:', error);
    throw error;
  }
};

// --- Función para actualizar un producto ---
export const updateProduct = async (productId, updateData, newImageAsset) => {
  try {
    console.log('✏️ [SERVICE] Actualizando producto:', productId);
    
    // Validaciones
    if (!updateData.nombre || !updateData.nombre.trim()) {
      throw new Error('El nombre del producto es requerido');
    }

    if (!updateData.precio || parseFloat(updateData.precio) <= 0) {
      throw new Error('El precio debe ser mayor a 0');
    }

    // Preparar objeto de actualización
    const dataToUpdate = {
      nombre: updateData.nombre.trim(),
      precio: parseFloat(updateData.precio),
      categoria: updateData.categoria?.trim() || null,
      descripcion: updateData.descripcion?.trim() || null,
    };
    
    // Solo actualizar imagen si hay una nueva imagen seleccionada
    if (newImageAsset) {
      // Obtener la imagen actual del producto primero
      const { data: currentProduct } = await supabase
        .from('productos')
        .select('imagen_url')
        .eq('id', productId)
        .single();

      console.log('📤 [SERVICE] Nueva imagen detectada, subiendo...');
      const imagenUrl = await uploadProductImageForEdit(newImageAsset, currentProduct?.imagen_url);
      dataToUpdate.imagen_url = imagenUrl;
    }
    
    const { error } = await supabase
      .from('productos')
      .update(dataToUpdate)
      .eq('id', productId);

    if (error) {
      console.error('❌ [SERVICE] Error al actualizar producto:', error);
      throw new Error('No se pudo actualizar el producto: ' + error.message);
    }

    console.log('✅ [SERVICE] Producto actualizado correctamente');
    return { success: true };
  } catch (error) {
    console.error('❌ [SERVICE] Error en updateProduct:', error);
    throw error;
  }
};

// --- Función para eliminar un producto ---
export const deleteProduct = async (productId) => {
  try {
    console.log('🗑️ [SERVICE] Eliminando producto:', productId);
    
    // Obtener datos del producto para eliminar la imagen
    const { data: producto, error: fetchError } = await supabase
      .from('productos')
      .select('imagen_url')
      .eq('id', productId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ [SERVICE] Error al obtener producto:', fetchError);
      throw new Error('No se pudo obtener el producto: ' + fetchError.message);
    }

    // Eliminar imagen del storage si existe
    if (producto?.imagen_url) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Extraer el path del storage de la URL
          const urlParts = producto.imagen_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const filePath = `${user.id}/${fileName}`;

          console.log('🗑️ [SERVICE] Eliminando imagen del storage:', filePath);
          
          const { error: storageError } = await supabase.storage
            .from('productos')
            .remove([filePath]);

          if (storageError) {
            console.error('❌ [SERVICE] Error al eliminar imagen del storage:', storageError);
          } else {
            console.log('✅ [SERVICE] Imagen eliminada del storage');
          }
        }
      } catch (storageError) {
        console.error('❌ [SERVICE] Error procesando eliminación de imagen:', storageError);
      }
    }

    // Eliminar el producto
    const { error: deleteError } = await supabase
      .from('productos')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error('❌ [SERVICE] Error al eliminar producto:', deleteError);
      throw new Error('No se pudo eliminar el producto: ' + deleteError.message);
    }

    console.log('✅ [SERVICE] Producto eliminado correctamente');
    return { success: true };
  } catch (error) {
    console.error('❌ [SERVICE] Error en deleteProduct:', error);
    throw error;
  }
};