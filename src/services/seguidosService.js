// En: src/services/seguidosService.js
// Este servicio maneja la lógica de seguimiento de artesanos por parte de los clientes.

import { supabase } from '../supabase/client';

/**
 * Verifica si un cliente ya sigue a un artesano.
 * @param {string} clienteId - El ID del cliente.
 * @param {string} artesanoId - El ID del artesano.
 * @returns {Promise<boolean>} - Retorna `true` si el cliente sigue al artesano, de lo contrario `false`.
 */
async function checkIfFollowing(clienteId, artesanoId) {
  if (!clienteId || !artesanoId) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('seguidores_artesanos')
      .select('id')
      .eq('cliente_id', clienteId)
      .eq('artesano_id', artesanoId)
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  } catch (error) {
    console.error('Error en checkIfFollowing:', error.message);
    return false; // Devolver false en caso de error para no bloquear la UI
  }
}

/**
 * Permite a un cliente seguir a un artesano.
 * @param {string} clienteId - El ID del cliente que va a seguir.
 * @param {string} artesanoId - El ID del artesano a ser seguido.
 * @returns {Promise<{success: boolean, error?: any}>}
 */
async function followArtesano(clienteId, artesanoId) {
  const { error } = await supabase
    .from('seguidores_artesanos')
    .insert({ cliente_id: clienteId, artesano_id: artesanoId });

  return { success: !error, error };
}

/**
 * Permite a un cliente dejar de seguir a un artesano.
 * @param {string} clienteId - El ID del cliente.
 * @param {string} artesanoId - El ID del artesano.
 * @returns {Promise<{success: boolean, error?: any}>}
 */
async function unfollowArtesano(clienteId, artesanoId) {
  const { error } = await supabase
    .from('seguidores_artesanos')
    .delete()
    .eq('cliente_id', clienteId)
    .eq('artesano_id', artesanoId);

  return { success: !error, error };
}

/**
 * Obtiene la lista de artesanos que un cliente sigue.
 * @param {string} clienteId - El ID del cliente.
 * @returns {Promise<{success: boolean, data?: any[], error?: any}>}
 */
async function getFollowedArtisans(clienteId) {
  if (!clienteId) {
    return { success: false, error: 'Client ID is required' };
  }

  try {
    const { data, error } = await supabase
      .from('seguidores_artesanos')
      .select(`
        artesanos (
          user_id,
          nombre,
          avatar_url
        )
      `)
      .eq('cliente_id', clienteId);

    if (error) throw error;
    return { success: true, data: data.map(item => item.artesanos) };
  } catch (error) {
    console.error('Error fetching followed artisans:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene la lista de productos guardados por un cliente.
 * @param {string} clienteId - El ID del cliente.
 * @returns {Promise<{success: boolean, data?: any[], error?: any}>}
 */
async function getSavedProducts(clienteId) {
  if (!clienteId) {
    return { success: false, error: 'Client ID is required' };
  }

  try {
    const { data, error } = await supabase
      .from('productos_guardados')
      .select(`
        producto:productos (
          id,
          nombre,
          imagen_url,
          artesano:artesanos (
            nombre
          )
        )
      `)
      .eq('user_id', clienteId);

    if (error) throw error;
    // Filtramos los resultados nulos y extraemos solo la información del producto
    return { success: true, data: data.map(item => item.producto).filter(Boolean) };
  } catch (error) {
    console.error('Error fetching saved products:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene la lista de eventos guardados por un cliente.
 * @param {string} clienteId - El ID del cliente.
 * @returns {Promise<{success: boolean, data?: any[], error?: any}>}
 */
async function getSavedEvents(clienteId) {
  if (!clienteId) {
    return { success: false, error: 'Client ID is required' };
  }

  try {
    const { data, error } = await supabase
      .from('eventos_guardados')
      .select(`
        evento:eventos (
          id,
          nombre,
          imagen_url,
          fecha,
          ubicacion,
          descripcion
        )
      `)
      .eq('user_id', clienteId);

    if (error) throw error;
    return { success: true, data: data.map(item => item.evento).filter(Boolean) };
  } catch (error) {
    console.error('Error fetching saved events:', error.message);
    return { success: false, error: error.message };
  }
}

export const seguidosService = {
  checkIfFollowing,
  followArtesano,
  unfollowArtesano,
  getFollowedArtisans,
  getSavedProducts,
  getSavedEvents,
};