// src/services/eventsService.js
import { supabase } from '../supabase/client';
import { decode } from 'base64-arraybuffer';
import { Alert } from 'react-native';

/**
 * Verifica si un usuario es administrador
 * Solo los administradores pueden crear eventos
 * @param {string} userId - ID del usuario a verificar
 * @returns {Promise<boolean>} - true si es administrador, false en caso contrario
 */
const isAdmin = async (userId) => {
    try {
        if (!userId) return false;

        const { data: profileData, error } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single();

        if (error || !profileData) {
            return false;
        }

        return profileData.rol === 'admin';
    } catch (error) {
        return false;
    }
};

/**
 * Crea un nuevo evento en la base de datos
 * NOTA: Solo los administradores pueden crear eventos
 * Sube la imagen al bucket de Supabase Storage si se proporciona
 * @param {string} creadorId - ID del creador del evento (debe ser administrador)
 * @param {string} nombre - Nombre del evento
 * @param {string} descripcion - Descripción del evento
 * @param {string} fecha - Fecha del evento
 * @param {string|null} ubicacion - Ubicación del evento (opcional)
 * @param {string|null} imageBase64 - Imagen del evento en base64
 * @param {string|null} imageMimeType - Tipo de MIME de la imagen
 * @returns {Promise<{success: boolean, data?: object, error?: string}>} - Datos del evento creado
 */
export const createEvent = async (creadorId, nombre, descripcion, fecha, hora, ubicacion = null, imageBase64 = null, imageMimeType = null) => {
    try {
        // Validaciones básicas
        if (!creadorId || !creadorId.trim()) {
            return { success: false, error: 'El ID del creador es requerido' };
        }

        // Verificar que el usuario sea administrador
        const userIsAdmin = await isAdmin(creadorId);
        if (!userIsAdmin) {
            return { success: false, error: 'Solo los administradores pueden crear eventos' };
        }

        if (!nombre || !nombre.trim()) {
            return { success: false, error: 'El nombre del evento es requerido' };
        }
        if (!descripcion || !descripcion.trim()) {
            return { success: false, error: 'La descripción del evento es requerida' };
        }
        if (!fecha) {
            return { success: false, error: 'La fecha del evento es requerida' };
        }

        let imageUrl = null;
        // Si hay imagen, subirla a Supabase Storage
        if (imageBase64) {
            try {
                const fileExt = imageMimeType ? imageMimeType.split('/')[1] : 'jpg'; // Extrae la extensión o usa 'jpg' por defecto
                const fileName = `${Date.now()}.${fileExt}`; // Genera un nombre único para la imagen
                const filePath = `${creadorId}/${fileName}`; // Guarda en una carpeta con el ID del creador

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('imagenes-eventos') // CORREGIDO: bucket correcto
                    .upload(filePath, decode(imageBase64), {
                        contentType: imageMimeType ?? 'image/jpeg',
                        upsert: false // No sobrescribir si ya existe (opcional)
                    });

                if (uploadError) {
                    throw new Error('Error al subir la imagen: ' + uploadError.message);
                }

                // Obtener la URL pública de la imagen subida
                const { data: urlData } = supabase.storage.from('imagenes-eventos').getPublicUrl(filePath); // CORREGIDO: bucket correcto
                imageUrl = urlData.publicUrl;
                console.log('Imagen subida exitosamente. URL:', imageUrl);
            } catch (error) {
                Alert.alert('Error de Imagen', 'No se pudo subir la imagen, pero se intentará guardar el evento.');
            }
        }

        // Insertar los datos del evento en la tabla 'eventos'
        // NOTA: Si la columna 'nombre' no existe en tu tabla, comenta la línea siguiente
        // y agrega la columna 'nombre' de tipo 'text' en Supabase
        const insertData = {
            creador_id: creadorId,
            descripcion: descripcion.trim(),
            fecha: fecha,
            hora: hora, // <-- AÑADIDO: Guardar la hora
            imagen_url: imageUrl,
        };
        
        // Agregar nombre solo si la columna existe (descomenta cuando agregues la columna en Supabase)
        // Cuando agregues la columna 'nombre' en Supabase, descomenta la siguiente línea:
        insertData.nombre = nombre.trim();
        
        // Agregar ubicación si se proporciona
        if (ubicacion && ubicacion.trim()) {
            insertData.ubicacion = ubicacion.trim();
        }
        
        const { data, error } = await supabase.from('eventos').insert(insertData).select().single();

        if (error) {
            return { success: false, error: 'Error al guardar el evento: ' + error.message };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Crea un evento para el usuario actual
 * NOTA: Solo los administradores pueden crear eventos
 * Obtiene el usuario de la sesión automáticamente y verifica que sea administrador
 * @param {string} nombre - Nombre del evento
 * @param {string} descripcion - Descripción del evento
 * @param {string} fecha - Fecha del evento
 * @param {string|null} ubicacion - Ubicación del evento (opcional)
 * @param {Object} imageAsset - Imagen del evento en formato de asset (opcional)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>} - Datos del evento creado
 */
export const createEventForCurrentUser = async (nombre, descripcion, fecha, hora, ubicacion = null, imageAsset = null) => {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return { success: false, error: 'Usuario no autenticado' };
        }

        // Verificar que el usuario sea administrador
        const userIsAdmin = await isAdmin(user.id);
        if (!userIsAdmin) {
            return { success: false, error: 'Solo los administradores pueden crear eventos' };
        }

        return await createEvent(
            user.id,
            nombre,
            descripcion,
            fecha,
            hora,
            ubicacion,
            imageAsset?.base64 || null,
            imageAsset?.mimeType || null
        );
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Actualiza un evento existente
 * NOTA: Solo los administradores pueden actualizar eventos
 * @param {string} eventoId - ID del evento a actualizar
 * @param {string} nombre - Nuevo nombre del evento
 * @param {string} descripcion - Nueva descripción del evento
 * @param {string} fecha - Nueva fecha del evento
 * @param {string} hora - Nueva hora del evento
 * @param {string|null} ubicacion - Nueva ubicación del evento (opcional)
 * @param {string|null} imageBase64 - Nueva imagen del evento en base64 (opcional)
 * @param {string|null} imageMimeType - Tipo de MIME de la imagen (opcional)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>} - Datos del evento actualizado
 */
export const updateEvent = async (eventoId, nombre, descripcion, fecha, hora, ubicacion = null, imageBase64 = null, imageMimeType = null) => {
    try {
        // Validaciones básicas
        if (!eventoId) {
            return { success: false, error: 'El ID del evento es requerido' };
        }

        if (!nombre || !nombre.trim()) {
            return { success: false, error: 'El nombre del evento es requerido' };
        }
        if (!descripcion || !descripcion.trim()) {
            return { success: false, error: 'La descripción del evento es requerida' };
        }
        if (!fecha) {
            return { success: false, error: 'La fecha del evento es requerida' };
        }

        // Obtener el evento actual para verificar el creador_id
        const { data: currentEvent, error: fetchError } = await supabase
            .from('eventos')
            .select('creador_id')
            .eq('id', eventoId)
            .single();

        if (fetchError || !currentEvent) {
            return { success: false, error: 'Evento no encontrado' };
        }

        // Verificar que el usuario sea administrador
        const userIsAdmin = await isAdmin(currentEvent.creador_id);
        if (!userIsAdmin) {
            return { success: false, error: 'Solo los administradores pueden actualizar eventos' };
        }

        // Preparar datos de actualización
        const updateData = {
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            fecha: fecha,
            hora: hora, // <-- AÑADIDO: Guardar la hora
        };
        
        // Agregar ubicación si se proporciona
        if (ubicacion !== null) {
            if (ubicacion.trim()) {
                updateData.ubicacion = ubicacion.trim();
            } else {
                updateData.ubicacion = null;
            }
        }

        // Si hay una nueva imagen, subirla a Supabase Storage
        if (imageBase64) {
            try {
                const fileExt = imageMimeType ? imageMimeType.split('/')[1] : 'jpg';
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${currentEvent.creador_id}/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('imagenes-eventos')
                    .upload(filePath, decode(imageBase64), {
                        contentType: imageMimeType ?? 'image/jpeg',
                        upsert: false
                    });

                if (uploadError) {
                    throw new Error('Error al subir la imagen: ' + uploadError.message);
                }

                // Obtener la URL pública de la imagen subida
                const { data: urlData } = supabase.storage.from('imagenes-eventos').getPublicUrl(filePath);
                updateData.imagen_url = urlData.publicUrl;
                console.log('Nueva imagen subida exitosamente. URL:', urlData.publicUrl);
            } catch (error) {
                // Si falla la subida de imagen, continuar sin actualizar la imagen
                console.log('Error al subir nueva imagen, se mantendrá la imagen actual');
            }
        }

        // Actualizar el evento
        const { data, error } = await supabase
            .from('eventos')
            .update(updateData)
            .eq('id', eventoId)
            .select()
            .single();

        if (error) {
            return { success: false, error: 'Error al actualizar el evento: ' + error.message };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Actualiza un evento para el usuario actual
 * NOTA: Solo los administradores pueden actualizar eventos
 * @param {string} eventoId - ID del evento a actualizar
 * @param {string} nombre - Nuevo nombre del evento
 * @param {string} descripcion - Nueva descripción del evento
 * @param {string} fecha - Nueva fecha del evento
 * @param {string} hora - Nueva hora del evento
 * @param {string|null} ubicacion - Nueva ubicación del evento (opcional)
 * @param {Object} imageAsset - Nueva imagen del evento en formato de asset (opcional)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>} - Datos del evento actualizado
 */
export const updateEventForCurrentUser = async (eventoId, nombre, descripcion, fecha, hora, ubicacion = null, imageAsset = null) => {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return { success: false, error: 'Usuario no autenticado' };
        }

        // Verificar que el usuario sea administrador
        const userIsAdmin = await isAdmin(user.id);
        if (!userIsAdmin) {
            return { success: false, error: 'Solo los administradores pueden actualizar eventos' };
        }

        return await updateEvent(
            eventoId,
            nombre,
            descripcion,
            fecha,
            hora,
            ubicacion,
            imageAsset?.base64 || null,
            imageAsset?.mimeType || null
        );
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Obtiene todos los eventos
 * @returns {Promise<{success: boolean, data?: array, error?: string}>} - Datos de los eventos encontrados
 */
export const getEvents = async () => {
    try {
        const { data, error } = await supabase
            .from('eventos')
            .select('*')
            .order('fecha', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        // Normalizar la fecha para que solo muestre YYYY-MM-DD
        const normalizedData = (data || []).map(evento => {
            if (evento.fecha && typeof evento.fecha === 'string') {
                // Cortamos la cadena para obtener solo la parte de la fecha.
                // "2026-05-13 12:00:00+00" -> "2026-05-13"
                evento.fecha = evento.fecha.substring(0, 10);
            }
            return evento;
        });

        return { success: true, data: normalizedData };
    } catch (error) {
        return { success: false, error: error.message };
    }
};


/**
 * Eliminar un evento existente
 * NOTA: Solo los administradores pueden eliminar eventos
 * @param {string} eventoId - ID del evento a eliminar
 * @returns {Promise<{success: boolean, error?: string}>} - Resultado de la operación
 */
export const deleteEvent = async (eventoId) => {
    try {
        if(!eventoId) {
            return { success: false, error: 'El ID del evento es requerido' };
        }

        const { data: {user} } = await supabase.auth.getUser();
        if (!user || !(await isAdmin(user.id))) {
            return { success: false, error: 'Solo los administradores pueden eliminar eventos' };
        }

        const {error} = await supabase.from('eventos').delete().eq('id', eventoId);
        if (error) {
            return { success: false, error: 'Error al eliminar el evento: ' + error.message };
        }
        return { success: true };
        
    } catch (error) {
        return { success: false, error: error.message }; 
    }
};

// Exportar como objeto para compatibilidad
export const eventsService = {
    createEvent,
    createEventForCurrentUser,
    updateEvent,
    updateEventForCurrentUser,
    getEvents,
    deleteEvent
};


export default eventsService;
