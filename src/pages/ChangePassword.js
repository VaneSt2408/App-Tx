// En: src/pages/ChangePassword.js
import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text } from 'react-native';
// Se elimina useNavigation porque ya no lo necesitamos para forzar la redirección
import { supabase } from '../supabase/client';

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      return Alert.alert('Campos vacíos', 'Por favor completa ambos campos.');
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'Las contraseñas no coinciden.');
    }

    try {
      setLoading(true);
      console.log('[ChangePassword] 🔐 Intentando actualizar contraseña...');

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        console.error('[ChangePassword] ❌ Error al actualizar:', error);
        Alert.alert('Error', 'No se pudo actualizar la contraseña.');
        // Nota: No es necesario setLoading(false) aquí por el bloque `finally`
        return;
      }

      console.log('[ChangePassword] ✅ Contraseña actualizada en Supabase.');
      
      // --- ✅ CAMBIO PRINCIPAL ---
      // Se elimina la navegación forzada y el signOut.
      // Ahora solo mostramos una alerta de éxito. El listener en App.js
      // se encargará de la redirección automática al detectar el evento 'USER_UPDATED'.
      Alert.alert(
        '¡Éxito!',
        'Tu contraseña ha sido actualizada. Serás redirigido en un momento.'
      );

    } catch (error) {
      console.error('[ChangePassword] ❌ Error inesperado:', error);
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

