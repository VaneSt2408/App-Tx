// En: app/(app)/ChangePassword.js -> Archivo de cambio de contraseña (Frontend)
// Este archivo es el encargado de mostrar el formulario de cambio de contraseña en la aplicación.
// Permite cambiar la contraseña del usuario registrado en la base de datos.

// Importaciones
import React, { useState } from 'react'; // Importa la librería React y el hook 'useState' para manejar el estado del componente.
import { View, TextInput, Button, Alert, StyleSheet, Text } from 'react-native'; // Importa componentes de UI básicos de React Native.
import { supabase } from '../../src/supabase/client'; // Importa el cliente de Supabase para interactuar con la base de datos y la autenticación.
import { useAuth } from '../../src/context/AuthContext'; // Importa el contexto de autenticación.

export default function ChangePassword() { // Define y exporta el componente funcional 'ChangePassword'.
  const { refreshProfile } = useAuth(); // Obtiene la función para refrescar el perfil.
  const [newPassword, setNewPassword] = useState(''); // Crea un estado para guardar la nueva contraseña que escribe el usuario.
  const [confirmPassword, setConfirmPassword] = useState(''); // Crea un estado para guardar la confirmación de la contraseña.
  const [loading, setLoading] = useState(false); // Crea un estado para saber si una operación está en curso (ej. para mostrar un spinner).

  // Define la función asíncrona que se ejecutará al presionar el botón de cambiar contraseña.
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      return Alert.alert('Campos vacíos', 'Por favor completa ambos campos.');
    }
    // Valida si las contraseñas escritas en ambos campos no coinciden.
    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'Las contraseñas no coinciden.');
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        Alert.alert('Error', 'No se pudo actualizar la contraseña.'); 
        return; 
      } 
      await refreshProfile();
      Alert.alert(
        '¡Éxito!', 
        'Tu contraseña ha sido actualizada. Serás redirigido en un momento.' 
      );
    } catch (error) {  
      Alert.alert('Error', 'Ocurrió un problema inesperado.'); 
    } finally { 
      setLoading(false); 
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

