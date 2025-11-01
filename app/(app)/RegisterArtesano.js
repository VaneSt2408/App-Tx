// En: app/(app)/RegisterArtesano.js -> Archivo de registro de artesano (Frontend)
// Este archivo es el encargado de mostrar el formulario de registro de artesano en la aplicación.
// Permite registrar un nuevo artesano en la aplicación mediante un formulario de registro.

// Importaciones
import React, { useState, useEffect } from 'react'; // Importa React y los hooks 'useState' y 'useEffect'.
import { View, TextInput, Button, Alert, StyleSheet, TouchableOpacity, Text, ScrollView, ActivityIndicator } from 'react-native'; // Importa varios componentes de UI de React Native.
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Importa una librería de íconos.
import { useNavigation } from '@react-navigation/native'; // Importa el hook para manejar la navegación entre pantallas.
import { supabase } from '../../src/supabase/client'; // Importa el cliente de Supabase.
import { completeArtesanoRegistration } from '../../src/services/userService'; // Importa la función de servicio para el registro.

export default function RegisterArtesano() { // Define y exporta el componente de la pantalla de registro.
  const navigation = useNavigation(); // Obtiene el objeto de navegación para poder cambiar de pantalla.

  // --- Estados del componente ---
  const [user, setUser] = useState(null); // Estado para guardar la información del usuario actual.
  const [initialLoading, setInitialLoading] = useState(true); // Estado para la pantalla de carga inicial.
  const [registerLoading, setRegisterLoading] = useState(false); // Estado para el botón de registro mientras se procesa.

  // --- Estados para los campos del formulario ---
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [curp, setCurp] = useState('');
  const [telefono, setTelefono] = useState('');
  const [numero_ine, setNumero_Ine] = useState('');
  const [folio, setFolio] = useState('');

  // Hook 'useEffect' que se ejecuta una sola vez cuando el componente se monta.
  useEffect(() => {
    // Define una función asíncrona para obtener los datos del usuario.
    const fetchUser = async () => {
      // Obtiene la sesión del usuario actual desde Supabase.
      const { data: { user } } = await supabase.auth.getUser();
      // Si existe un usuario, lo guarda en el estado.
      if (user) setUser(user);
      // Termina la carga inicial para mostrar el formulario.
      setInitialLoading(false);
    };
    fetchUser(); // Llama a la función para que se ejecute.
  }, []); // El array vacío asegura que el efecto solo se ejecute una vez.

  // Función para generar un número de folio aleatorio.
  const generarFolio = () => {
    // Crea un string con el prefijo 'FOL-' y una cadena alfanumérica aleatoria.
    const nuevoFolio = 'FOL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    // Actualiza el estado del folio con el nuevo valor.
    setFolio(nuevoFolio);
  };

  // Función principal que maneja el envío del formulario de registro.
  const handleRegister = async () => {
    // Si ya se está registrando, detiene la función para evitar envíos múltiples.
    if (registerLoading) return;
    // Valida que las dos contraseñas ingresadas coincidan.
    if (password !== confirmPassword) return Alert.alert('Error', 'Las contraseñas no coinciden.');
    // Valida que todos los campos requeridos del formulario estén llenos.
    if (!nombre || !telefono || !password || !categoria || !ubicacion || !curp || !numero_ine || !folio) {
      return Alert.alert('Error', 'Por favor completa todos los campos obligatorios.');
    }

    // Inicia un bloque 'try...catch' para manejar errores durante el registro.
    try {
      setRegisterLoading(true); // Activa el estado de carga del botón.
      // Crea un objeto con todos los datos del formulario.
      const registrationData = {
        password, nombre, telefono, ubicacion, categoria, curp, numero_ine, folio
      };

      // Llama a la función del servicio, le pasa los datos y espera el resultado.
      const result = await completeArtesanoRegistration(registrationData);

      // Si el registro en el servicio fue exitoso.
      if (result.success) {
        // Muestra una alerta de éxito al usuario.
        Alert.alert(
          '¡Registro Exitoso!',
          'Tu cuenta de artesano ha sido creada exitosamente. Ahora crea tu contraseña definitiva.',
          [ // Define los botones de la alerta.
            {
              text: 'Continuar', // Texto del botón.
              // Al presionar, navega a la pantalla 'ChangePassword'.
              onPress: () => {
                navigation.navigate('ChangePassword', { tempPassword: password });
              },
            },
          ]
        );
      } else { // Si el registro falló (result.success es false).
        // Muestra una alerta con el mensaje de error que devolvió el servicio.
        Alert.alert('Error en el Registro', result.error || 'Ocurrió un error inesperado.');
      }
    } catch (error) { // Si ocurre un error de conexión o un problema crítico.
      // Muestra una alerta genérica de error crítico.
      Alert.alert('Error Crítico', 'No se pudo conectar con el servicio. Inténtalo de nuevo.');
    } finally { // Este bloque se ejecuta siempre, sin importar si hubo éxito o error.
      setRegisterLoading(false); // Desactiva el estado de carga del botón.
    }
  };

  // Renderizado condicional: si la carga inicial aún no ha terminado.
  if (initialLoading) {
    // Muestra una pantalla de carga.
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
