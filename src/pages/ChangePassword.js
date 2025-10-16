// En: src/pages/ChangePassword.js
import React, { useState } from 'react'; // Importa la librería React y el hook 'useState' para manejar el estado del componente.
import { View, TextInput, Button, Alert, StyleSheet, Text } from 'react-native'; // Importa componentes de UI básicos de React Native.
import { supabase } from '../supabase/client'; // Importa el cliente de Supabase para interactuar con la base de datos y la autenticación.

export default function ChangePassword() { // Define y exporta el componente funcional 'ChangePassword'.
  const [newPassword, setNewPassword] = useState(''); // Crea un estado para guardar la nueva contraseña que escribe el usuario.
  const [confirmPassword, setConfirmPassword] = useState(''); // Crea un estado para guardar la confirmación de la contraseña.
  const [loading, setLoading] = useState(false); // Crea un estado para saber si una operación está en curso (ej. para mostrar un spinner).

  // Define la función asíncrona que se ejecutará al presionar el botón de cambiar contraseña.
  const handleChangePassword = async () => {
    // Valida si alguno de los dos campos de contraseña está vacío.
    if (!newPassword || !confirmPassword) {
      // Si están vacíos, muestra una alerta al usuario y detiene la ejecución.
      return Alert.alert('Campos vacíos', 'Por favor completa ambos campos.');
    }

    // Valida si las contraseñas escritas en ambos campos no coinciden.
    if (newPassword !== confirmPassword) {
      // Si no coinciden, muestra una alerta de error y detiene la ejecución.
      return Alert.alert('Error', 'Las contraseñas no coinciden.');
    }

    // Inicia un bloque 'try...catch' para manejar posibles errores durante la llamada a Supabase.
    try {
      setLoading(true); // Pone el estado de 'loading' en 'true' para indicar que el proceso comenzó.
      console.log('[ChangePassword] 🔐 Intentando actualizar contraseña...'); // Imprime un mensaje en la consola para depuración.

      // Llama a la función de Supabase para actualizar los datos del usuario actual, pasándole la nueva contraseña.
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      // Comprueba si la respuesta de Supabase contiene un objeto de error.
      if (error) {
        console.error('[ChangePassword] ❌ Error al actualizar:', error); // Si hay un error, lo muestra en la consola.
        Alert.alert('Error', 'No se pudo actualizar la contraseña.'); // Muestra una alerta genérica al usuario.
        return; // Detiene la ejecución de la función.
      }

      console.log('[ChangePassword] ✅ Contraseña actualizada en Supabase.'); // Imprime un mensaje de éxito en la consola.
      
      // Muestra una alerta al usuario indicando que la operación fue exitosa.
      Alert.alert(
        '¡Éxito!', // Título de la alerta.
        'Tu contraseña ha sido actualizada. Serás redirigido en un momento.' // Mensaje de la alerta.
      );

    } catch (error) { // Si ocurre un error inesperado en el bloque 'try', se ejecuta este bloque 'catch'.
      console.error('[ChangePassword] ❌ Error inesperado:', error); // Muestra el error inesperado en la consola.
      Alert.alert('Error', 'Ocurrió un problema inesperado.'); // Informa al usuario del error.
    } finally { // Este bloque se ejecuta siempre, haya habido éxito o error.
      setLoading(false); // Regresa el estado de 'loading' a 'false' para indicar que el proceso terminó.
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crea tu Contraseña Definitiva</Text>
      <TextInput
        style={styles.input}
        placeholder="Nueva contraseña"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmar contraseña"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <Button
        title={loading ? 'Guardando...' : 'Guardar Contraseña'}
        onPress={handleChangePassword}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 15, borderRadius: 8 },
});

