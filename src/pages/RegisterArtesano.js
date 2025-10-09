//Frontend
import { 
  View, 
  TextInput, 
  Button, 
  Alert, 
  StyleSheet, 
  TouchableOpacity, 
  Text 
} from 'react-native'; // Importa los componentes necesarios de React Native
import { registrarNuevoArtesano } from '../services/userService'; // Importa la función para registrar un nuevo artesano
import React, { useState, useEffect } from 'react'; // Importa React y useState, useEffect para manejar el estado y efectos secundarios
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Importa los íconos de MaterialCommunityIcons

export default function RegisterArtesano() { // Componente principal para registrar un nuevo artesano
  const [email, setEmail] = useState(''); // Estado para el correo electrónico
  const [password, setPassword] = useState(''); // Importa React y useState, useEffect para manejar el estado y efectos secundarios
  const [nombre, setNombre] = useState(''); // Estado para el nombre del artesano
  const [ubicacion, setUbicacion] = useState(''); // Estado para la ubicación del artesano
  const [categoria, setCategoria] = useState(''); // Estado para la categoría del artesano
  const [curp, setCurp] = useState(''); // Estado para el CURP del artesano
  const [telefono, setTelefono] = useState(''); // Estado para el teléfono del artesano
  const [numero_ine, setNumero_Ine] = useState(''); // Estado para el número de INE del artesano
  const [folio, setFolio] = useState(''); // Estado para el folio del artesano
  const [isEmailValid, setIsEmailValid] = useState(true); // Estado para validar el formato del email
  const [confirmEmail, setConfirmEmail] = useState(''); // Estado para confirmar el correo electrónico
  const [emailError, setEmailError] = useState(''); // Estado para el mensaje de error del correo electrónico

  // Validar que los correos coincidan
useEffect(() => { // Se ejecuta cada vez que email o confirmEmail cambian
  if (confirmEmail.length > 0 && email !== confirmEmail) { // Si los correos no coinciden
    setEmailError('Los correos electrónicos no coinciden.'); // Muestra un mensaje de error
  } else {
    setEmailError(''); // Limpia el mensaje de error si coinciden
  }
}, [email, confirmEmail]); // Se ejecuta cada vez que email o confirmEmail cambian

// Validar formato del correo electrónico
  const validateEmail = (text) => { // Función para validar el formato del correo electrónico
    // Expresión regular simple para validar el formato del email
    const regex = /\S+@\S+\.\S+/; // Patrón básico para un email válido
    if (regex.test(text)) { // Si el formato es válido
      setIsEmailValid(true); // Actualiza el estado a válido
    } else {
      setIsEmailValid(false); // Actualiza el estado a inválido
    }
    setEmail(text); // Actualiza el estado del correo electrónico con el texto ingresado
  };

  //Generar folio automático
  const generarFolio = () => { // Función para generar el folio automáticamente
  if (!nombre.trim() || !curp.trim()) { // Verifica que nombre y CURP no estén vacíos
    Alert.alert('Datos insuficientes', 'Por favor, introduce el nombre y el CURP primero.'); // Muestra una alerta si faltan datos
    return; // Detiene la ejecución si faltan datos
  }

  const iniciales = nombre //.trim() // Elimina espacios en blanco al inicio y al final
    .split(' ') // Divide el nombre en palabras
    .map(palabra => palabra[0]) // Toma la primera letra de cada palabra
    .join(''); // Une las letras para formar las iniciales

  const curpSlice = curp.substring(0, 5); // Toma los primeros 5 caracteres del CURP

  const folioGenerado = `${iniciales}${curpSlice}`.toUpperCase(); // Combina las iniciales y el CURP, y convierte a mayúsculas
  setFolio(folioGenerado); // Actualiza el estado del folio con el valor generado
};

  
  //Registra los datos agregados en el formulario
  const handleRegister = async () => { // Función para manejar el registro del artesano
    if (!email || !password || !nombre || !curp || !numero_ine || !ubicacion || !categoria || !telefono || !folio) { // Verifica que todos los campos obligatorios estén llenos
      Alert.alert('Error', 'Por favor, completa los campos obligatorios.'); // Muestra una alerta si faltan campos
      return; // Detiene el proceso si faltan campos
    }
    if (email !== confirmEmail) { // Verifica que los correos coincidan
    Alert.alert('Error', 'Los correos electrónicos no coinciden.'); // Muestra una alerta si no coinciden
    return; // Detiene el proceso si no coinciden
  }

    try {
      const datos = {
        email,
        password,
        nombre,
        ubicacion,
        categoria,
        curp,
        telefono,
        numero_ine,
        folio
      }; // Crea un objeto con los datos del formulario

      console.log("DATOS ENVIADOS DESDE EL FRONTEND:", datos); // Muestra los datos en la consola para depuración
      const result = await registrarNuevoArtesano(datos); // Llama a la función para registrar el nuevo artesano
      Alert.alert('Éxito', result.message); // Muestra el mensaje de éxito de la Edge Function

      // Limpiar el formulario
      setEmail('');
      setPassword('');
      setNombre('');
      setUbicacion('');
      setCategoria('');
      setCurp('');
      setTelefono('');
      setNumero_Ine('');
      setFolio('');

    } catch (error) {
      Alert.alert('Error', error.message); // Muestra una alerta si ocurre un error
       console.error("OBJETO DE ERROR COMPLETO:", JSON.stringify(error, null, 2)); // Muestra el objeto de error completo en la consola para depuración
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Nombre del artesano"
        value={nombre}
        onChangeText={setNombre}
      />

        <TextInput
        style={[styles.input, !isEmailValid && styles.inputError]}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={validateEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {!isEmailValid && <Text style={styles.errorText}>Formato de correo incorrecto.</Text>}

      <TextInput
        style={styles.input}
        placeholder="Confirmar correo electrónico"
        value={confirmEmail}
        onChangeText={setConfirmEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Contraseña temporal"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

        <TextInput
        style={styles.input}
        placeholder="Categoría"
        value={categoria}
        onChangeText={setCategoria}
        secureTextEntry
      />

        <TextInput
        style={styles.input}
        placeholder="Ubicación"
        value={ubicacion}
        onChangeText={setUbicacion}
        secureTextEntry
      />

        <TextInput
        style={styles.input}
        placeholder="CURP"
        value={curp}
        onChangeText={setCurp}
        secureTextEntry
      />

        <TextInput
        style={styles.input}
        placeholder="Número de télefono"
        value={telefono}
        onChangeText={setTelefono}
        secureTextEntry
      />

        <TextInput
        style={styles.input}
        placeholder="Número de Identificación (INE)"
        value={numero_ine}
        onChangeText={setNumero_Ine}
        secureTextEntry
      />

        <View style={styles.folioContainer}>
            <TextInput
            style={styles.folioInput}
            placeholder="Folio"
            value={folio}
            onChangeText={setFolio}
            />
            <TouchableOpacity style={styles.generateButton} onPress={generarFolio}>
            <MaterialCommunityIcons name="auto-fix" size={24} color="#2575fc" />
            </TouchableOpacity>
        </View>
      
      <TouchableOpacity style={styles.botonPersonalizado} onPress={handleRegister}></TouchableOpacity>
      <Button title="Registrar Artesano" onPress={handleRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
    botonPersonalizado: {
    backgroundColor: '#177eaaff', 
    paddingVertical: 10,       
    paddingHorizontal: 20,   
    borderRadius: 8,           
    borderWidth: 2,            
    borderColor: '#177eaaff',    

    
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  textoDelBoton: {
    color: 'white',            
    fontSize: 16,
    fontWeight: 'bold',
  },
    inputError: {
    borderColor: 'red', 
  },
  errorText: {
    color: 'red',
    marginBottom: -10,
  },
   input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  folioContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15,
  },
  folioInput: {
    flex: 1, 
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
  },
  generateButton: {
    padding: 8, 
    marginLeft: 8,
  }
});