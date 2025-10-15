// En: src/services/passwordService.js
import { supabase } from '../supabase/client';

export const changeUserPassword = async (newPassword) => {
  console.log('[passwordService] 🔐 Iniciando cambio de contraseña...');

  try {
    // 1️⃣ Cambiar contraseña
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error('[passwordService] ❌ Error al actualizar contraseña:', error);
      return { success: false, error: error.message };
    }

    console.log('[passwordService] ✅ Contraseña actualizada correctamente.');

    // 2️⃣ Limpiar sesión actual forzadamente
    // Esto elimina el token viejo para evitar el "congelamiento"
    await supabase.auth.signOut();

    // 3️⃣ Esperar un momento para que el cierre de sesión se procese correctamente
    await new Promise((resolve) => setTimeout(resolve, 400));

    console.log('[passwordService] 🚪 Sesión cerrada correctamente.');
    return { success: true };

  } catch (error) {
    console.error('[passwordService] ❌ Error general atrapado:', error);
    return { success: false, error: error.message || error };
  }
};

