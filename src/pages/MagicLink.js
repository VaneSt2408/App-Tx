// En: src/pages/InviteArtesano.js
import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text } from 'react-native';
import { sendArtesanoInvite } from '../services/userService';

export default function InviteArtesano() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendInvite = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor, introduce un correo electrónico.');
      return;
    }
    setLoading(true);
    try {
      await sendArtesanoInvite(email);
      Alert.alert('Éxito', `Se ha enviado un enlace de registro a ${email}.`);
      setEmail('');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Invitar a un Nuevo Artesano</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo del nuevo artesano"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button 
        title={loading ? "Enviando..." : "Enviar Enlace de Registro"} 
        onPress={handleSendInvite} 
        disabled={loading} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 20, borderRadius: 8 },
});