// En: src/pages/ChangePassword.js
import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase/client';

export default function ChangePassword() {
  const navigation = useNavigation();
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
        setLoading(false);
        return;
      }

      console.log('[ChangePassword] ✅ Contraseña actualizada en Supabase.');

      // ⚡ Forzar redirección inmediata al login
      Alert.alert(
        '¡Contraseña actualizada!',
        'Tu contraseña se cambió exitosamente. Por favor inicia sesión de nuevo.',
        [
          {
            text: 'OK',
            onPress: () => {
              // 1️⃣ Cerrar sesión sin esperar confirmación
              supabase.auth.signOut().catch(() => {});
              
              // 2️⃣ Forzar navegación al Login
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            },
          },
        ]
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

