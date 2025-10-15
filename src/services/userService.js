//Backend
import { supabase } from '../supabase/client';
import { Alert } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';

// Función para enviar el link mágico (No tocar)
export const sendArtesanoInvite = async (email) => { 
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      data: { role: 'En proceso' },
      emailRedirectTo: makeRedirectUri(),
    },
  });

  if (error) {
    if (error.message.includes("User already registered")) {
      throw new Error("Este correo ya está registrado en el sistema.");
    }
    throw new Error(`Error al enviar el enlace: ${error.message}`);
  }

  return data;
};



export const completeArtesanoRegistration = async (registrationData) => {
  console.log("[userService] --- Iniciando completeArtesanoRegistration ---");

  const { nombre, telefono, ubicacion, categoria, curp, numero_ine, folio } = registrationData;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No hay sesión activa. El usuario debe autenticarse primero.");

    // Actualizar perfil
    const { error: profileError } = await supabase
      .from('perfiles')
      .update({ rol: 'artesano', telefono })
      .eq('id', user.id);
    if (profileError) throw profileError;

    // Insertar en artesanos
    const { data: artesanoData, error: artesanoError } = await supabase
      .from('artesanos')
      .insert({
        user_id: user.id,
        nombre,
        ubicacion,
        categoria,
        curp,
        numero_ine,
        folio,
      })
      .select();
    if (artesanoError) throw artesanoError;

    console.log("[userService] ✅ Datos de artesano insertados con éxito.");

    return { success: true, artesanoData };
  } catch (error) {
    console.error("[userService] ❌ ERROR GENERAL ATRAPADO:", error);
    return { success: false, error: error.message || error };
  }
};