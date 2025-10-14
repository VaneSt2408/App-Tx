//Backend
import { supabase } from '../supabase/client';
import { Alert } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';

// Función para enviar el link mágico
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

// Registrar artesano (CON LOGS)
export const completeArtesanoRegistration = async (user, registrationData) => {
  console.log("[userService] --- Iniciando completeArtesanoRegistration ---");

  const { password, nombre, telefono, ubicacion, categoria, curp, numero_ine, folio } = registrationData;

  try {
    // 1. Actualizar la contraseña
    console.log(`[userService] 1. Actualizando contraseña para el usuario: ${user.id}`);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      console.error("[userService] ❌ ERROR al actualizar contraseña:", updateError);
      throw updateError;
    }
    console.log("[userService] ✅ Contraseña actualizada con éxito.");

    // 2. Actualizar perfil
    console.log(`[userService] 2. Actualizando 'perfiles' para el usuario: ${user.id}`);
    const { error: profileError } = await supabase
      .from('perfiles')
      .update({ rol: 'artesano', telefono })
      .eq('id', user.id);
    if (profileError) {
      console.error("[userService] ❌ ERROR al actualizar perfil:", profileError);
      throw profileError;
    }
    console.log("[userService] ✅ Perfil actualizado con éxito.");

    // 3. Insertar datos en artesanos
    console.log(`[userService] 3. Insertando en 'artesanos' para el usuario: ${user.id}`);
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
      .select(); // Confirmar lo que se insertó

    if (artesanoError) {
      console.error("[userService] ❌ ERROR al insertar en 'artesanos':", artesanoError);
      throw artesanoError;
    }

    console.log("[userService] ✅ Datos de artesano insertados con éxito:", artesanoData);
    console.log("[userService] --- Registro completado con éxito ---");

    return { success: true };

  } catch (error) {
    console.error("[userService] ❌ ERROR GENERAL ATRAPADO:", error);
    throw error; // Re-lanza para manejo en el componente frontend
  }
};