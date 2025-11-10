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
      return asset; // Retornamos el objeto completo con base64
    }
    
    return null;
  } catch (error) {
    Alert.alert('Error', 'No se pudo seleccionar la imagen');
    return null;
  }
};

// --- Función para subir imagen a Supabase Storage (siguiendo la lógica de completeProfile) ---
export const uploadImageToSupabase = async (imageAsset, productId) => {
  try {
    
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
      throw new Error(`Error al subir imagen: ${uploadError.message}`);
    }

    // Si la subida fue exitosa, obtenemos la URL pública de la imagen
    const { data: urlData } = supabase.storage.from('productos').getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    throw error;
  }
};

// --- Función para crear un nuevo producto (siguiendo la lógica de completeProfile) ---
export const createProduct = async (productData) => {
  try {
    
    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No hay sesión activa');
    }

    let imagenUrl = null;

    // --- Subida de la imagen (si se proporcionó) ---
    if (productData.imageAsset) {
      imagenUrl = await uploadImageToSupabase(productData.imageAsset, null);
    }

    // Insertar producto en la base de datos con la URL de la imagen
    const { data, error } = await supabase
      .from('productos')
      .insert({
        artesano_id: user.id,
        nombre: productData.nombre,
        descripcion: productData.descripcion,
        precio: parseFloat(productData.precio) || 0, // Convertimos a número
        categoria: productData.categoria || 'general',
        imagen_url: imagenUrl,
        estado: 'activo'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear producto: ${error.message}`);
    }
    return data;
  } catch (error) {
    throw error;
  }
};

// --- Función para subir imagen y actualizar producto con URL ---
export const updateProductWithImage = async (productId, imageUrl) => {
  try {
    
    const { error } = await supabase
      .from('productos')
      .update({ imagen_url: imageUrl })
      .eq('id', productId);

    if (error) {
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }
    return true;
  } catch (error) {
    throw error;
  }
};

// --- Función principal para subir producto completo ---
export const uploadProduct = async (productData, imageUri) => {
  try {
    
    // 1. Crear el producto en la base de datos
    const product = await createProduct(productData);
    
    // 2. Si hay imagen, subirla y actualizar el producto
    if (imageUri) {
      const imageUrl = await uploadImageToSupabase(imageUri, product.id);
      await updateProductWithImage(product.id, imageUrl);
    }
    
    return { success: true, product };
  } catch (error) {
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
      throw new Error(`Error al obtener productos: ${error.message}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// --- Función para subir imagen de producto para edición ---
export const uploadProductImageForEdit = async (imageAsset, oldImageUrl) => {
  try {

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
        
      } catch (error) {
      }
    }

    // Subir nueva imagen
    const { error: uploadError } = await supabase.storage
      .from('productos')
      .upload(filePath, decode(imageAsset.base64), {
        contentType: imageAsset.mimeType ?? 'image/jpeg',
      });

    if (uploadError) {
      throw new Error('Error al subir la imagen: ' + uploadError.message);
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage.from('productos').getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    throw error;
  }
};

// --- Función para actualizar un producto ---
export const updateProduct = async (productId, updateData, newImageAsset) => {
  try {
    
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

      const imagenUrl = await uploadProductImageForEdit(newImageAsset, currentProduct?.imagen_url);
      dataToUpdate.imagen_url = imagenUrl;
    }
    
    const { error } = await supabase
      .from('productos')
      .update(dataToUpdate)
      .eq('id', productId);

    if (error) {
      throw new Error('No se pudo actualizar el producto: ' + error.message);
    }

    return { success: true };
  } catch (error) {
    throw error;
  }
};

// --- Función para eliminar un producto ---
export const deleteProduct = async (productId) => {
  try {
    
    // Obtener datos del producto para eliminar la imagen
    const { data: producto, error: fetchError } = await supabase
      .from('productos')
      .select('imagen_url')
      .eq('id', productId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
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

          
          const { error: storageError } = await supabase.storage
            .from('productos')
            .remove([filePath]);

          if (storageError) {
          } else {
          }
        }
      } catch (storageError) {
      }
    }

    // Opcional (recomendado si no hay ON DELETE CASCADE): Eliminar likes asociados
    try {
      await supabase
        .from('likes_productos')
        .delete()
        .eq('producto_id', productId);
    } catch (likesError) {
      // No es crítico, continuar con la eliminación del producto
    }

    // Eliminar el producto
    const { error: deleteError } = await supabase
      .from('productos')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      throw new Error('No se pudo eliminar el producto: ' + deleteError.message);
    }
    return { success: true };
  } catch (error) {
    throw error;
  }
};


// --- Función para dar/tomar like a un producto ---
export const toggleLikeProduct = async (productoId) => {
  try {
    // Log para debugging: entrada a toggleLikeProduct
    console.log('[productService] toggleLikeProduct called', { productoId });

    // Obtener usuario actual desde supabase.auth.getUser()
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      return { success: false, error: userError.message || 'No se pudo obtener la sesión' };
    }

    const userId = user?.id || null;

    if (!userId) {
      return { success: false, error: 'Debes iniciar sesión para dar like' };
    }

    // Llamar directamente a la función auxiliar definida en este módulo
    const result = await toggleLike(productoId, userId);

    // Log resultado
    console.log('[productService] toggleLikeProduct result', { productoId, userId, result });

    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};
 // Función auxiliar para dar/tomar like
  export const toggleLike = async(productoId, userId) => {
    try {
      console.log('[productService] toggleLike called', { productoId, userId });
      // Verificar si ya existe el like
      const { data: existingLike, error: checkError } = await supabase
        .from('likes_productos')
        .select('id')
        .eq('producto_id', productoId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.log('[productService] toggleLike checkError', { checkError });
        return { success: false, error: checkError.message };
      }

      let liked;

      if (existingLike) {
        console.log('[productService] toggleLike existingLike found', { existingLike });
        // Quitar like
        const { error: deleteError } = await supabase
          .from('likes_productos')
          .delete()
          .eq('producto_id', productoId)
          .eq('user_id', userId);

        if (deleteError) {
          console.log('[productService] toggleLike deleteError', { deleteError });
          return { success: false, error: deleteError.message };
        }

        liked = false;
      } else {
        console.log('[productService] toggleLike no existingLike, inserting');
        // Dar like
        const { error: insertError } = await supabase
          .from('likes_productos')
          .insert({
            producto_id: productoId,
            user_id: userId,
          });

        if (insertError) {
          console.log('[productService] toggleLike insertError', { insertError });
          return { success: false, error: insertError.message };
        }

        liked = true;
      }

      // Obtener el nuevo conteo de likes
      const { count, error: countError } = await supabase
        .from('likes_productos')
        .select('*', { count: 'exact', head: true })
        .eq('producto_id', productoId);

      console.log('[productService] toggleLike countResult', { count, countError });
      if (countError) {
      }

      return {
        success: true,
        liked,
        likes_count: count || 0,
      };

    } catch (error) {
      console.log('[productService] toggleLike caught error', { error });
      return { success: false, error: error.message };
    }
  }