// En: src/services/passwordService.js
import { supabase } from '../supabase/client'; // Importa la instancia del cliente de Supabase para interactuar con sus servicios.

// Define y exporta una función asíncrona para cambiar la contraseña del usuario.
export const changeUserPassword = async (newPassword) => {
  // Imprime un mensaje en la consola para saber cuándo se inicia el proceso.
  console.log('[passwordService] 🔐 Iniciando cambio de contraseña...');

  // Inicia un bloque 'try...catch' para manejar cualquier error que pueda ocurrir.
  try {
    // 1️⃣ Llama al método 'updateUser' de Supabase Auth para cambiar la contraseña del usuario actual.
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    // Si la operación de actualización devuelve un error...
    if (error) {
      // ...imprime el error detallado en la consola...
      console.error('[passwordService] ❌ Error al actualizar contraseña:', error);
      // ...y devuelve un objeto indicando que la operación falló, junto con el mensaje de error.
      return { success: false, error: error.message };
    }

    // Si no hubo error, imprime un mensaje de éxito en la consola.
    console.log('[passwordService] ✅ Contraseña actualizada correctamente.');

    // 2️⃣ Cierra la sesión del usuario inmediatamente después de cambiar la contraseña.
    // Esto es CRUCIAL para invalidar el token de sesión antiguo y forzar un nuevo inicio de sesión.
    await supabase.auth.signOut();

    // 3️⃣ Crea una pequeña pausa de 400 milisegundos.
    // Esto le da tiempo al proceso de 'signOut' a completarse y propagarse correctamente antes de continuar.
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Imprime un mensaje confirmando que la sesión se cerró.
    console.log('[passwordService] 🚪 Sesión cerrada correctamente.');
    
    // Devuelve un objeto indicando que todo el proceso fue exitoso.
    return { success: true };

  } catch (error) { // Si ocurre cualquier otro error inesperado en el bloque 'try'...
    // ...lo captura y lo imprime en la consola...
    console.error('[passwordService] ❌ Error general atrapado:', error);
    // ...y devuelve un objeto de fallo con el mensaje de error correspondiente.
    return { success: false, error: error.message || error };
  }
};

