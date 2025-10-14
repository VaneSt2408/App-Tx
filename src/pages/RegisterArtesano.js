// En: src/pages/RegisterArtesano.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  Button, 
  Alert, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../supabase/client';
import { completeArtesanoRegistration } from '../services/userService';
import { signOut } from '../services/authService'; // En: src/pages/Home.js
export default function RegisterArtesano() {
  // Estados principales
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados del formulario
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [curp, setCurp] = useState('');
  const [telefono, setTelefono] = useState('');
  const [numero_ine, setNumero_Ine] = useState('');
  const [folio, setFolio] = useState('');


  const handleLogout = async () => { // Función para manejar el cierre de sesión
          await signOut(); // Llama a la función signOut
          // No se navega aquí. App.js se encarga de todo.
      };

  // Obtener usuario autenticado al cargar
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUser(user);
      setLoading(false);
    };
    fetchUser();
  }, []);

  // Función para generar folio automático
  const generarFolio = () => {
    const nuevoFolio = 'FOL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setFolio(nuevoFolio);
  };

  const handleRegister = async () => {
    console.log("[handleRegister] --- Iniciando proceso de registro ---");

    if (!user) {
        console.error("[handleRegister] ❌ ERROR: El objeto 'user' es nulo.");
        return Alert.alert('Error', 'No se ha podido identificar al usuario.');
    }
    console.log("[handleRegister] ✅ 1. Usuario identificado:", { id: user.id, email: user.email });

    if (password !== confirmPassword) {
        return Alert.alert('Error', 'Las contraseñas no coinciden.');
    }
    if (password.length < 8) {
        return Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres.');
    }
    if (!nombre || !telefono) {
        return Alert.alert('Error', 'El nombre y teléfono son obligatorios.');
    }
    console.log("[handleRegister] ✅ 2. Validaciones básicas superadas.");

    try {
        const registrationData = { password, nombre, telefono, ubicacion, categoria, curp, numero_ine, folio };
        console.log("[handleRegister] ➡️ 3. Enviando datos al servicio:", registrationData);
        
        await completeArtesanoRegistration(user, registrationData);
        console.log("[handleRegister] ✅ 4. El servicio se ejecutó con éxito.");
        
        Alert.alert('¡Registro Completo!', 'Tu cuenta ha sido creada. Por favor, inicia sesión.');
        
        console.log("[handleRegister] 🚪 5. Cerrando sesión.");
        await supabase.auth.signOut();

    } catch (error) {
        console.error("[handleRegister] ❌ ERROR ATRAPADO EN CATCH:", error);
        Alert.alert('Error en el Registro', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Completa tu Registro</Text>
      <Button title="Cerrar Sesión" onPress={handleLogout} color="#db4437" />
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
      <Button title="Finalizar Registro" onPress={handleRegister}/>
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