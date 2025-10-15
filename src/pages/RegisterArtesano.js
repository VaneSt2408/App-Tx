// En: src/pages/RegisterArtesano.js
import React, { useState, useEffect } from 'react';
import { 
  View, TextInput, Button, Alert, StyleSheet, TouchableOpacity, Text, 
  ScrollView, ActivityIndicator 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase/client';
import { completeArtesanoRegistration } from '../services/userService';

export default function RegisterArtesano() {
  const navigation = useNavigation();

  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [registerLoading, setRegisterLoading] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [curp, setCurp] = useState('');
  const [telefono, setTelefono] = useState('');
  const [numero_ine, setNumero_Ine] = useState('');
  const [folio, setFolio] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUser(user);
      setInitialLoading(false);
    };
    fetchUser();
  }, []);

  const generarFolio = () => {
    const nuevoFolio = 'FOL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setFolio(nuevoFolio);
  };

  const handleRegister = async () => {
    if (registerLoading) return;
    if (password !== confirmPassword) return Alert.alert('Error', 'Las contraseñas no coinciden.');
    if (!nombre || !telefono || !password || !categoria || !ubicacion || !curp || !numero_ine || !folio) {
      return Alert.alert('Error', 'Por favor completa todos los campos obligatorios.');
    }

    try {
      setRegisterLoading(true);
      const registrationData = {
        password,
        nombre,
        telefono,
        ubicacion,
        categoria,
        curp,
        numero_ine,
        folio
      };

      const result = await completeArtesanoRegistration(registrationData);

      if (result.success) {
        Alert.alert(
          '¡Registro Exitoso!',
          'Tu cuenta de artesano ha sido creada exitosamente. Ahora crea tu contraseña definitiva.',
          [
            {
              text: 'Continuar',
              onPress: () => {
                navigation.navigate('ChangePassword', { tempPassword: password });
              },
            },
          ]
        );
      } else {
        Alert.alert('Error en el Registro', result.error || 'Ocurrió un error inesperado.');
      }
    } catch (error) {
      Alert.alert('Error Crítico', 'No se pudo conectar con el servicio. Inténtalo de nuevo.');
    } finally {
      setRegisterLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2575fc" />
        <Text style={{ marginTop: 10, fontSize: 16 }}>Cargando información...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Completa tu Registro</Text>
      <TextInput style={[styles.input, styles.disabledInput]} value={user?.email} editable={false} />
      <TextInput style={styles.input} placeholder="Nombre completo" value={nombre} onChangeText={setNombre} />
      <TextInput style={styles.input} placeholder="Número de teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Crea una contraseña" value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput style={styles.input} placeholder="Confirma tu contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
      <TextInput style={styles.input} placeholder="Categoría" value={categoria} onChangeText={setCategoria} />
      <TextInput style={styles.input} placeholder="Ubicación" value={ubicacion} onChangeText={setUbicacion} />
      <TextInput style={styles.input} placeholder="CURP" value={curp} onChangeText={setCurp} />
      <TextInput style={styles.input} placeholder="Número de Identificación (INE)" value={numero_ine} onChangeText={setNumero_Ine} />
      <View style={styles.folioContainer}>
        <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Folio" value={folio} onChangeText={setFolio} />
        <TouchableOpacity style={styles.generateButton} onPress={generarFolio}>
          <MaterialCommunityIcons name="auto-fix" size={28} color="#2575fc" />
        </TouchableOpacity>
      </View>
      <Button 
        title={registerLoading ? "Procesando..." : "Finalizar Registro"} 
        onPress={handleRegister}
        disabled={registerLoading}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 15, borderRadius: 8 },
  disabledInput: { backgroundColor: '#f0f0f0', color: '#888' },
  folioContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  generateButton: { marginLeft: 10 },
});
