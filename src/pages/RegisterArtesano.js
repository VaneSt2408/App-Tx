//Frontend
import { 
  View, 
  TextInput, 
  Button, 
  Alert, 
  StyleSheet, 
  TouchableOpacity, 
  Text 
} from 'react-native';
import { registrarNuevoArtesano } from '../services/userService';
import React, { useState, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RegisterArtesano() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [curp, setCurp] = useState('');
  const [telefono, setTelefono] = useState('');
  const [numero_ine, setNumero_Ine] = useState('');
  const [folio, setFolio] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [emailError, setEmailError] = useState('');

useEffect(() => {
  if (confirmEmail.length > 0 && email !== confirmEmail) {
    setEmailError('Los correos electrónicos no coinciden.');
  } else {
    setEmailError('');
  }
}, [email, confirmEmail]);

  const validateEmail = (text) => {
    // Expresión regular simple para validar el formato del email
    const regex = /\S+@\S+\.\S+/;
    if (regex.test(text)) {
      setIsEmailValid(true);
    } else {
      setIsEmailValid(false);
    }
    setEmail(text);
  };

  //Generar folio automático
  const generarFolio = () => {
  if (!nombre.trim() || !curp.trim()) {
    Alert.alert('Datos insuficientes', 'Por favor, introduce el nombre y el CURP primero.');
    return;
  }

  const iniciales = nombre
    .split(' ') 
    .map(palabra => palabra[0]) 
    .join(''); 

  const curpSlice = curp.substring(0, 5);

  const folioGenerado = `${iniciales}${curpSlice}`.toUpperCase();
  setFolio(folioGenerado);
};

  
  //Registra los datos agregados en el formulario
  const handleRegister = async () => {
    if (!email || !password || !nombre || !curp || !numero_ine || !ubicacion || !categoria || !telefono || !folio) {
      Alert.alert('Error', 'Por favor, completa los campos obligatorios.');
      return;
    }
    if (email !== confirmEmail) {
    Alert.alert('Error', 'Los correos electrónicos no coinciden.');
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
      };

      console.log("DATOS ENVIADOS DESDE EL FRONTEND:", datos);
      const result = await registrarNuevoArtesano(datos);
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
      Alert.alert('Error', error.message);
       console.error("OBJETO DE ERROR COMPLETO:", JSON.stringify(error, null, 2)); 
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