// En: src/services/productService.js
import { supabase } from '../supabase/client';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer'; // Importar decode aquí
import * as ImageManipulator from 'expo-image-manipulator'; // Importamos el manipulador de imágenes

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

/**
 * Permite seleccionar MÚLTIPLES imágenes de la galería y las comprime.
 * @param {number} selectionLimit - El número máximo de imágenes que se pueden seleccionar.
 * @returns {Promise<Array<object>|null>} - Un array de assets de imagen o null.
 */
export const selectMultipleAndCompressImages = async (selectionLimit = 5) => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería para seleccionar imágenes.');
      return null;
    }

    // 1. Seleccionamos las imágenes SIN compresión para obtener su tamaño original
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // CORRECCIÓN: Usar la nueva sintaxis
      allowsEditing: true, // ¡CLAVE! Habilita el editor de recorte para cada imagen.
      aspect: [1, 1], // Fija el recorte a un formato cuadrado.
      quality: 1, // Mantenemos la calidad alta antes de nuestra propia compresión.
      // NOTA: allowsMultipleSelection se omite, ya que el usuario seleccionará una por una.
    });

    if (result.canceled || !result.assets) {
      return null;
    }

    console.log(`[productService] ==> Se seleccionaron ${result.assets.length} imágenes. Comprimiendo...`);
    // Con allowsEditing, el resultado siempre es un array con un solo asset.
    const asset = result.assets[0];

    // LOG del tamaño original (después del recorte)
    const originalSizeInBytes = asset.fileSize || (asset.base64 ? (asset.base64.length * 3) / 4 : 0);
    if (originalSizeInBytes > 0) {
      const originalSizeMB = (originalSizeInBytes / (1024 * 1024)).toFixed(2);
      console.log(`[productService] Imagen (Después de recortar): ${originalSizeMB} MB`);
    }

    // 2. Comprimimos la imagen recortada
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      asset.uri,
      [], // Sin acciones de redimensionamiento, solo compresión
      { 
        compress: 0.5, // Nivel de compresión (0.5 = 50% de calidad, puedes ajustarlo)
        format: ImageManipulator.SaveFormat.JPEG, // Formato de salida
        base64: true, // ¡Crucial! Pedimos el base64
      }
    );

    // LOG del tamaño comprimido
    const compressedSizeInBytes = (manipulatedImage.base64.length * 3) / 4;
    const compressedSizeMB = (compressedSizeInBytes / (1024 * 1024)).toFixed(2);
    console.log(`[productService] Imagen (Comprimida): ${compressedSizeMB} MB`);

    return [manipulatedImage]; // Devolvemos un array para mantener la compatibilidad
  } catch (error) {
    console.error('Error al seleccionar múltiples imágenes:', error);
    Alert.alert('Error', 'No se pudieron seleccionar las imágenes.');
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
export const createProduct = async (productData, imageAssets) => {
  // LOG: Inicio de la función
  console.log('[productService] ==> Inicia createProduct.');
  console.log('[productService] Datos del producto:', JSON.stringify(productData, null, 2));
  console.log(`[productService] Número de imágenes a subir: ${imageAssets.length}`);

  // 1. Validación de la cantidad de imágenes
  if (!imageAssets || imageAssets.length < 3 || imageAssets.length > 5) {
    throw new Error('Debes seleccionar entre 3 y 5 imágenes para el producto.');
  }

  try {
    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No hay sesión activa');
    }
    console.log(`[productService] Usuario autenticado: ${user.id}`);

    // --- PASO 2: Insertar datos principales del producto ---
    console.log('[productService] ==> Paso 2: Insertando registro principal del producto...');
    const { data: newProduct, error: productError } = await supabase
      .from('productos')
      .insert({
        ...productData,
        // CORRECCIÓN: La columna se llama 'artesano_id', no 'user_id'.
        artesano_id: user.id,
        imagen_url: 'URL_TEMPORAL_DE_PORTADA', // Se actualizará después
      })
      .select()
      .single();

    if (productError) {
      console.error('[productService] ERROR en Paso 2:', productError);
      throw new Error('No se pudo crear el registro del producto: ' + productError.message);
    }
    console.log('[productService] <== Paso 2: Registro principal creado con éxito. ID:', newProduct.id);

    const productId = newProduct.id;

    // --- PASO 3: Subir todas las imágenes a Supabase Storage ---
    // CAMBIO: Se procesan las imágenes una por una en lugar de en paralelo.
    console.log('[productService] ==> Paso 3 y 4: Procesando imágenes secuencialmente...');
    
    let firstImageUrl = null;

    for (const [index, asset] of imageAssets.entries()) {
      console.log(`[productService] Procesando imagen ${index + 1} de ${imageAssets.length}...`);
      const fileExt = asset.uri.split('.').pop();
      const fileName = `producto_${productId}_${Date.now()}_${index}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      console.log(`[productService]   - Ruta de archivo: ${filePath}`);

      const decodedData = decode(asset.base64);
      
      // CORRECCIÓN: Asegurar que el tipo MIME sea 'image/jpeg' para archivos .jpg
      const mimeType = fileExt === 'jpg' ? 'image/jpeg' : `image/${fileExt}`;
      console.log(`[productService]   - Tipo MIME: ${mimeType}`);

      // 3a. Subir la imagen
      const { error: uploadError } = await supabase.storage
        .from('productos') // CORRECCIÓN: Usar el bucket 'productos'
        .upload(filePath, decodedData, { contentType: mimeType });

      if (uploadError) {
        console.error(`[productService] ERROR al subir imagen ${index + 1}:`, uploadError);
        throw new Error(`Fallo al subir la imagen ${index + 1}.`);
      }
      console.log(`[productService]   - Imagen ${index + 1} subida con éxito.`);

      // 3b. Obtener la URL pública
      const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(filePath); // CORRECCIÓN: Usar el bucket 'productos'
      console.log(`[productService]   - URL pública obtenida: ${publicUrl}`);

      // Guardar la URL de la primera imagen para la portada
      if (index === 0) {
        firstImageUrl = publicUrl;
      }

      // 4. Insertar la URL en la base de datos INMEDIATAMENTE
      const { error: insertImageError } = await supabase.from('producto_imagenes').insert({
        producto_id: productId,
        imagen_url: publicUrl,
        orden: index
      });
      if (insertImageError) {
        console.error(`[productService] ERROR al guardar URL de imagen ${index + 1}:`, insertImageError);
        throw new Error(`No se pudo guardar la URL de la imagen ${index + 1}.`);
      }
      console.log(`[productService]   - URL de imagen ${index + 1} guardada en la base de datos.`);
    }
    console.log('[productService] <== Pasos 3 y 4: Todas las imágenes han sido procesadas.');

    // --- PASO 5: Actualizar la imagen de portada en la tabla `productos` ---
    console.log('[productService] ==> Paso 5: Actualizando imagen de portada del producto...');
    const { error: updateCoverError } = await supabase
      .from('productos')
      .update({ imagen_url: firstImageUrl })
      .eq('id', productId);

    if (updateCoverError) console.error('Error al actualizar la portada:', updateCoverError);
    console.log('[productService] <== Paso 5: Portada actualizada.');

    console.log('[productService] <== Fin de createProduct: Proceso completado con éxito.');
    return { success: true, data: newProduct };
  } catch (error) {
    console.error('[productService] ERROR FATAL en createProduct:', error.message);
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
export const updateProductDetails = async (productId, updateData, newImageAsset) => {
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
      stock: parseInt(updateData.stock, 10) || 0,
      descripcion: updateData.descripcion?.trim() || null,
      estado: updateData.estado || 'activo',
      min_may: updateData.min_may || 'minoreo',
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

/**
 * Actualiza un producto con su galería de imágenes completa.
 * Sube nuevas imágenes, elimina las viejas y actualiza la base de datos.
 * @param {string} productId - El ID del producto a actualizar.
 * @param {object} productData - Datos del producto (nombre, precio, etc.).
 * @param {Array<object>} newImageAssets - El nuevo array de assets de imagen.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateProductWithImages = async (productId, productData, newImageAssets) => {
  console.log(`[productService] ==> Iniciando actualización completa para producto ID: ${productId}`);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado.');

    // --- PASO 1: Obtener la lista de imágenes ACTUALES del producto ---
    console.log('[productService] PASO 1: Obteniendo imágenes antiguas...' );
    const { data: oldImages, error: oldImagesError } = await supabase
      .from('producto_imagenes')
      .select('id, imagen_url')
      .eq('producto_id', productId);

    if (oldImagesError) throw new Error('No se pudo obtener la galería de imágenes actual.');
    console.log('[productService] PASO 1: Completado.');

    const oldImageUrls = oldImages.map(img => img.imagen_url);
    console.log(`[productService] Se encontraron ${oldImageUrls.length} imágenes antiguas.`);

    // --- PASO 2: Procesar y subir las NUEVAS imágenes ---
    const newImageUrls = [];
    let firstImageUrl = null;
    console.log('[productService] PASO 2: Procesando y subiendo nuevas imágenes...');

    for (const [index, asset] of newImageAssets.entries()) {
      // Si el asset ya tiene una URL (es una imagen que no se cambió), la reutilizamos.
      if (asset.uri && asset.uri.startsWith('https://')) {
        console.log(`[productService] Reutilizando imagen existente: ${asset.uri}`);
        newImageUrls.push(asset.uri);
        if (index === 0) firstImageUrl = asset.uri;
        continue;
      }

      // Si es una imagen nueva (base64), la subimos.
      if (asset.base64) {
        console.log(`[productService] Subiendo nueva imagen ${index + 1}...`);
        const fileExt = asset.uri.split('.').pop() || 'jpg';
        const fileName = `producto_${productId}_${Date.now()}_${index}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        const mimeType = asset.mimeType ?? 'image/jpeg';

        const { error: uploadError } = await supabase.storage
          .from('productos')
          .upload(filePath, decode(asset.base64), { contentType: mimeType });

        if (uploadError) throw new Error(`Fallo al subir la nueva imagen ${index + 1}.`);

        const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(filePath);
        newImageUrls.push(publicUrl);
        if (index === 0) firstImageUrl = publicUrl;
        console.log(`[productService] Nueva imagen ${index + 1} subida a: ${publicUrl}`);
      }
    }

    if (newImageUrls.length === 0) throw new Error('El producto debe tener al menos una imagen.');
    if (!firstImageUrl) firstImageUrl = newImageUrls[0];
    console.log('[productService] PASO 2: Completado.');

    // --- PASO 3: Actualizar la tabla `productos` con los nuevos datos y la portada ---
    // CORRECCIÓN: Solo actualizamos los datos de texto. La portada la actualizará la función RPC.
    console.log('[productService] PASO 3: Actualizando datos principales del producto...');
    const { error: updateProductError } = await supabase
      .from('productos')
      .update(productData) // Ya no pasamos 'imagen_url' aquí
      .eq('id', productId);

    if (updateProductError) throw new Error('No se pudo actualizar la información principal del producto.');
    console.log('[productService] PASO 3: Completado.');

    // --- PASO 4: Borrar y reinsertar las URLs en `producto_imagenes` ---
    // CAMBIO RADICAL: En lugar de borrar e insertar desde el cliente,
    // llamamos a una función RPC de la base de datos que lo hace de forma segura.
    console.log(`[productService] PASO 4: Llamando a RPC 'update_product_gallery' para el producto ID: ${productId}...`);
    
    const { error: rpcError } = await supabase.rpc('update_product_gallery', {
      p_product_id: productId,
      p_image_urls: newImageUrls
    });

    if (rpcError) {
      console.error('[productService] ERROR en RPC (update_product_gallery):', JSON.stringify(rpcError, null, 2));
      throw new Error('No se pudo actualizar la galería de imágenes: ' + rpcError.message);
    }
    console.log('[productService] PASO 4: Completado.');

    // El PASO 5 (borrar imágenes del Storage) ha sido eliminado.
    // La limpieza de imágenes huérfanas ahora será manejada por la función de base de datos 'delete_orphaned_files'.

    console.log(`[productService] <== Actualización completa para producto ID: ${productId} finalizada con éxito.`);
    return { success: true };
  } catch (error) {
    console.error('[productService] ERROR FATAL en updateProductWithImages:', error.message);
    throw error;
  }
};

// --- Función para eliminar un producto ---
export const deleteProduct = async (productId) => {
  try {
    // Al eliminar un producto de la tabla 'productos', la base de datos
    // debería encargarse de borrar en cascada (ON DELETE CASCADE) todos los
    // registros relacionados en 'producto_imagenes', 'likes_productos', etc.
    // La limpieza de los archivos en el Storage será manejada por la función
    // de base de datos 'delete_orphaned_files' que se ejecuta periódicamente.
    console.log(`[productService] Eliminando producto ID: ${productId} de la base de datos...`);

    const { error: deleteError } = await supabase
      .from('productos')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error(`[productService] Error al eliminar el producto:`, deleteError);
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