import { supabase } from '../../src/supabase/client';
import { decode } from 'base64-arraybuffer';
import 'react-native-get-random-values'; // Para generar nombres de archivo únicos si es necesario
import { Alert } from 'react-native'; // <-- ¡NUEVA IMPORTACIÓN!

// Función para crear una nueva publicación
export const createPost = async (userId, text, imageBase64, imageMimeType) => {
    let imageUrl = null;

    // 1. Si hay una imagen, subirla a Supabase Storage
    if (imageBase64) {
        try {
            const fileExt = imageMimeType ? imageMimeType.split('/')[1] : 'jpg'; // Extrae la extensión o usa 'jpg' por defecto
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${userId}/${fileName}`; // Guarda en una carpeta con el ID del artesano

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('imagenes-publicaciones') // Nombre del bucket que creamos
                .upload(filePath, decode(imageBase64), {
                    contentType: imageMimeType ?? 'image/jpeg',
                    upsert: false // No sobrescribir si ya existe (opcional)
                });

            if (uploadError) {
                console.error("Error uploading image:", uploadError);
                throw new Error('Error al subir la imagen: ' + uploadError.message);
            }

            // Obtener la URL pública de la imagen subida
            const { data: urlData } = supabase.storage.from('imagenes-publicaciones').getPublicUrl(filePath);
            imageUrl = urlData.publicUrl;

        } catch (error) {
            console.error("Catch block - Error uploading image:", error);
            // Decide si quieres detener el proceso si la imagen falla o continuar sin imagen
            // throw error; // Descomenta si la imagen es obligatoria
            Alert.alert("Error de Imagen", "No se pudo subir la imagen, pero se intentará guardar el texto.")
        }
    }

    // 2. Insertar los datos de la publicación en la tabla 'publicaciones'
    const { data: postData, error: insertError } = await supabase
        .from('publicaciones')
        .insert({
            artesano_user_id: userId,
            texto: text,
            imagen_url: imageUrl // Puede ser null si no se subió imagen o falló
        })
        .select() // Opcional: devuelve el post creado
        .single(); // Esperamos un solo resultado

    if (insertError) {
        console.error("Error inserting post:", insertError);
        throw new Error('Error al guardar la publicación: ' + insertError.message);
    }

    return postData; // Devuelve la publicación creada
};