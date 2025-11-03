// En: app/(app)/ClientProfile.js -> Archivo de perfil del cliente (Frontend) 
// Este archivo es el encargado de mostrar el perfil del cliente en la aplicación.
// Muestra el perfil del cliente registrado en la base de datos y permite editarlo, cambiar la contraseña, eliminar el perfil y cambiar la foto de perfil.

import React, { useState, useEffect, useRef } from 'react'; // Importar los hooks de react
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert,TouchableOpacity,Image,TextInput} from 'react-native'; // Importar los componentes de react-native
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Importar los componentes de expo-vector-icons
import { useRouter } from 'expo-router'; // Importar el router de expo-router
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importar AsyncStorage para persistencia
import { supabase } from '../../src/supabase/client'; // Importar el cliente de supabase
import { getClientProfile, editClientProfile, uploadAvatar, changeClientPassword, validateCurrentPassword, validateNewPassword, deleteClientProfile, deleteGoogleClientProfile } from '../../src/services/profileInfo'; // Importar los servicios de perfil de cliente
import { useAuth } from '../../src/context/AuthContext'; // Importar el contexto de autenticación
import * as ImagePicker from 'expo-image-picker'; // Importar el componente de expo-image-picker
import ChangePasswordModal from '../../components/ChangePasswordModal'; // Importar el modal de cambio de contraseña

export default function ClientProfile() { // Exportar la función ClientProfile
  const { signOut } = useAuth(); // Obtener el signOut del contexto de autenticación
  const [profile, setProfile] = useState(null); // Establecer el estado del perfil
  const [loading, setLoading] = useState(true); // Establecer el estado de carga
  const [isEditing, setIsEditing] = useState(false); // Establecer el estado de edición
  const [editData, setEditData] = useState({
    nombre_completo: '', // Establecer el estado del nombre completo
    telefono: '', // Establecer el estado del teléfono
    avatar_url: null // Establecer el estado de la url de la imagen
  });
  const [selectedImage, setSelectedImage] = useState(null); // Establecer el estado de la imagen seleccionada
  const [saving, setSaving] = useState(false); // Establecer el estado de guardado
  
  // Estados para cambio de contraseña
  const [showChangePassword, setShowChangePassword] = useState(false); // Establecer el estado de la visualización del modal de cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', // Establecer el estado de la contraseña actual
    newPassword: '', // Establecer el estado de la nueva contraseña
    confirmPassword: '' // Establecer el estado de la confirmación de la nueva contraseña
  });
  const [passwordLoading, setPasswordLoading] = useState(false); // Establecer el estado de carga
  const [showPasswords, setShowPasswords] = useState({ // Establecer el estado de la visualización del modal de contraseñas
    current: false, // Establecer el estado de la visualización de la contraseña actual
    new: false, // Establecer el estado de la visualización de la nueva contraseña
    confirm: false // Establecer el estado de la visualización de la confirmación de la nueva contraseña
  });
  
  // Estados para validaciones de seguridad
  const [currentPasswordValidated, setCurrentPasswordValidated] = useState(false); // Establecer el estado de la validación de la contraseña actual
  const [currentPasswordAttempts, setCurrentPasswordAttempts] = useState(0); // Establecer el estado de los intentos de la contraseña actual
  const [passwordBlocked, setPasswordBlocked] = useState(false); // Establecer el estado de la contraseña bloqueada
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0); // Establecer el estado de la duración del bloqueo de la contraseña
  const [passwordValidationErrors, setPasswordValidationErrors] = useState([]); // Establecer el estado de los errores de validación de la contraseña
  const [totalFailedAttempts, setTotalFailedAttempts] = useState(0); // Establecer el estado de los intentos fallidos de la contraseña
  
  // Refs para evitar race conditions en contadores
  const totalFailedAttemptsRef = useRef(0); // Ref compartido para TOTAL de intentos fallidos (cambio + eliminación)
  const currentPasswordAttemptsRef = useRef(0); // Ref para el contador de intentos de cambio de contraseña
  const deletePasswordAttemptsRef = useRef(0); // Ref para el contador de intentos de eliminación
  
  // Estados para eliminación de perfil
  const [showDeleteProfile, setShowDeleteProfile] = useState(false); // Establecer el estado de la visualización del modal de eliminación de perfil
  const [deletePasswordData, setDeletePasswordData] = useState({
    currentPassword: '' // Establecer el estado de la contraseña actual
  });
  const [deletePasswordLoading, setDeletePasswordLoading] = useState(false); // Establecer el estado de carga
  const [showDeletePassword, setShowDeletePassword] = useState(false); // Establecer el estado de la visualización del modal de eliminación de contraseña
  const [deletePasswordValidated, setDeletePasswordValidated] = useState(false); // Establecer el estado de la validación de la contraseña de eliminación
  const [deletePasswordAttempts, setDeletePasswordAttempts] = useState(0); // Establecer el estado de los intentos de la contraseña de eliminación
  const [deletePasswordBlocked, setDeletePasswordBlocked] = useState(false); // Establecer el estado de la contraseña de eliminación bloqueada
  const [deleteBlockTimeRemaining, setDeleteBlockTimeRemaining] = useState(0); // Establecer el estado de la duración del bloqueo de la contraseña de eliminación
  const [totalDeleteAttempts, setTotalDeleteAttempts] = useState(0); // DEPRECATED: Usar totalFailedAttempts (compartido)
  
  // Estados para eliminación de perfil Google
  const [showDeleteGoogleProfile, setShowDeleteGoogleProfile] = useState(false); // Establecer el estado de la visualización del modal de eliminación de perfil Google
  const [deleteGoogleLoading, setDeleteGoogleLoading] = useState(false); // Establecer el estado de carga
  const [isGoogleUser, setIsGoogleUser] = useState(false); // Establecer el estado de si el usuario es de Google
  
  const router = useRouter(); // Obtener el router de expo-router

  // Función para cargar intentos fallidos desde AsyncStorage
  const loadFailedAttempts = async () => {
    try {
      const attempts = await AsyncStorage.getItem('passwordFailedAttempts');
      if (attempts !== null) {
        const parsedAttempts = parseInt(attempts);
        setTotalFailedAttempts(parsedAttempts);
        totalFailedAttemptsRef.current = parsedAttempts;
      }
    } catch (error) {
      console.error('Error loading failed attempts:', error);
    }
  };

  // Función para guardar intentos fallidos en AsyncStorage
  const saveFailedAttempts = async (attempts) => {
    try {
      await AsyncStorage.setItem('passwordFailedAttempts', attempts.toString());
      totalFailedAttemptsRef.current = attempts;
      setTotalFailedAttempts(attempts);
    } catch (error) {
      console.error('Error saving failed attempts:', error);
    }
  };

  // Función para limpiar intentos fallidos
  const clearFailedAttempts = async () => {
    try {
      await AsyncStorage.removeItem('passwordFailedAttempts');
      totalFailedAttemptsRef.current = 0;
      setTotalFailedAttempts(0);
    } catch (error) {
      console.error('Error clearing failed attempts:', error);
    }
  };

  // Función para cargar intentos fallidos de eliminación desde AsyncStorage
  const loadDeleteAttempts = async () => {
    try {
      const attempts = await AsyncStorage.getItem('deleteFailedAttempts');
      if (attempts !== null) {
        const parsedAttempts = parseInt(attempts);
        setTotalDeleteAttempts(parsedAttempts);
        deletePasswordAttemptsRef.current = parsedAttempts;
      }
    } catch (error) {
      console.error('Error loading delete attempts:', error);
    }
  };

  // Función para guardar intentos fallidos de eliminación en AsyncStorage
  const saveDeleteAttempts = async (attempts) => {
    try {
      await AsyncStorage.setItem('deleteFailedAttempts', attempts.toString());
      deletePasswordAttemptsRef.current = attempts;
      setTotalDeleteAttempts(attempts);
    } catch (error) {
      console.error('Error saving delete attempts:', error);
    }
  };

  // Función para limpiar intentos fallidos de eliminación
  const clearDeleteAttempts = async () => {
    try {
      await AsyncStorage.removeItem('deleteFailedAttempts');
      deletePasswordAttemptsRef.current = 0;
      setTotalDeleteAttempts(0);
    } catch (error) {
      console.error('Error clearing delete attempts:', error);
    }
  };

  useEffect(() => { // Efecto para cargar el perfil del cliente
    fetchProfile(); // Cargar el perfil del cliente
    checkUserProvider(); // Verificar si el usuario es de Google
    loadFailedAttempts(); // Cargar intentos fallidos guardados
    loadDeleteAttempts(); // Cargar intentos de eliminación guardados
  }, []); // Dependencias del efecto

  // useEffect para manejar el contador de bloqueo
  useEffect(() => { // Efecto para manejar el contador de bloqueo
    let interval; // Establecer el intervalo
    if (passwordBlocked && blockTimeRemaining > 0) { // Si la contraseña está bloqueada y el tiempo de bloqueo es mayor a 0
      interval = setInterval(() => {
        setBlockTimeRemaining(prev => { // Establecer el tiempo de bloqueo
          if (prev <= 1) {
            setPasswordBlocked(false); // Desbloquear la contraseña
            setCurrentPasswordAttempts(0); // Establecer el contador de intentos de la contraseña actual a 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [passwordBlocked, blockTimeRemaining]);

  // Timer para bloqueo de eliminación de perfil
  useEffect(() => { // Efecto para manejar el contador de bloqueo de eliminación de perfil
    let interval; // Establecer el intervalo
    if (deletePasswordBlocked && deleteBlockTimeRemaining > 0) { // Si la contraseña de eliminación está bloqueada y el tiempo de bloqueo es mayor a 0
      interval = setInterval(() => {
        setDeleteBlockTimeRemaining(prev => { // Establecer el tiempo de bloqueo de eliminación
          if (prev <= 1) {
            setDeletePasswordBlocked(false); // Desbloquear la contraseña de eliminación
            setDeletePasswordAttempts(0); // Establecer el contador de intentos de la contraseña de eliminación a 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [deletePasswordBlocked, deleteBlockTimeRemaining]);

  const fetchProfile = async () => { // Función para cargar el perfil del cliente
    try {
      setLoading(true); // Establecer el estado de carga
      
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser(); // Obtener el usuario actual
      if (!user) { // Si no se encontró el usuario
        Alert.alert('Error', 'No se encontró la sesión del usuario'); // Mostrar alerta de error
        return;
      }

      // Obtener perfil del cliente
      const { data, error } = await getClientProfile(user.id); // Obtener el perfil del cliente
      
      if (error) { // Si hay error
        Alert.alert('Error', 'No se pudo cargar el perfil: ' + error); // Mostrar alerta de error
        return; 
      }

      setProfile(data); // Establecer el perfil del cliente
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado'); // Mostrar alerta de error
      console.error('Error fetching profile:', error); // Mostrar error en la consola
    } finally {
      setLoading(false); // Establecer el estado de carga
    }
  };

  const checkUserProvider = async () => { // Función para verificar si el usuario es de Google
    try {
      const { data: { user } } = await supabase.auth.getUser(); // Obtener el usuario actual
      if (user && user.app_metadata && user.app_metadata.provider) { // Si el usuario es de Google
        setIsGoogleUser(user.app_metadata.provider === 'google'); // Establecer el estado de si el usuario es de Google
      }
    } catch (error) {
      console.error('Error checking user provider:', error); // Mostrar error en la consola
    }
  };

  const handleGoBack = () => { // Función para volver a la página anterior
    router.back(); // Volver a la página anterior
  };

  const handleLogout = async () => { // Función para cerrar sesión
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => { // Función para cerrar sesión
            await signOut(); // Cerrar sesión
          }
        }
      ]
    );
  };


  const handleEdit = () => { // Función para editar el perfil del cliente
    setEditData({
      nombre_completo: profile.nombre_completo, // Establecer el estado del nombre completo
      telefono: profile.telefono, // Establecer el estado del teléfono
      avatar_url: profile.avatar_url // Establecer el estado de la url de la imagen
    });
    setIsEditing(true); // Establecer el estado de edición
  };

  const handleCancelEdit = () => { // Función para cancelar la edición del perfil del cliente
    setIsEditing(false);
    setEditData({
      nombre_completo: '',
      telefono: '',
      avatar_url: null
    });
    setSelectedImage(null);
  };

  const handleInputChange = (field, value) => { // Función para manejar el cambio de input en el perfil del cliente
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectImage = async () => { // Función para seleccionar la imagen del perfil del cliente
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync(); // Obtener el estado de los permisos de la galería
      if (status !== 'granted') { // Si no se tienen permisos de la galería
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería para seleccionar una foto'); // Mostrar alerta de permisos requeridos
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({ // Abrir el selector de imágenes
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Aspect ratio de la imagen
        quality: 0.5, // Calidad de la imagen
        base64: true, // Base64 de la imagen
      });

      if (!result.canceled && result.assets[0]) { // Si no se canceló la selección y se seleccionó una imagen
        setSelectedImage(result.assets[0]); // Establecer la imagen seleccionada
        setEditData(prev => ({
          ...prev,
          avatar_url: result.assets[0].uri // Establecer la url de la imagen
        }));
      }
    } catch (error) { 
      Alert.alert('Error', 'No se pudo seleccionar la imagen'); // Mostrar alerta de error
    }
  };

  const handleSave = async () => { // Función para guardar el perfil del cliente
    if (!editData.nombre_completo.trim()) { // Si el nombre completo está vacío
      Alert.alert('Error', 'El nombre completo es requerido'); // Mostrar alerta de error
      return;
    }

    setSaving(true); // Establecer el estado de guardado
    try {
      const { data: { user } } = await supabase.auth.getUser(); // Obtener el usuario actual
      if (!user) { // Si no se encontró el usuario
        Alert.alert('Error', 'No se encontró la sesión del usuario'); // Mostrar alerta de error
        return;
      }

      let avatarUrl = editData.avatar_url; // Establecer la url de la imagen

      // Si se seleccionó una nueva imagen, subirla
      if (selectedImage) { // Si se seleccionó una nueva imagen
        const { data: uploadedUrl, error: uploadError } = await uploadAvatar(user.id, selectedImage); // Subir la imagen
        if (uploadError) { // Si hay error
          Alert.alert('Error', 'No se pudo subir la imagen: ' + uploadError); // Mostrar alerta de error
          return;
        }
        avatarUrl = uploadedUrl; // Establecer la url de la imagen
      }

      // Actualizar perfil 
      const { data, error } = await editClientProfile(user.id, { // Actualizar el perfil del cliente
        nombre_completo: editData.nombre_completo, // Establecer el estado del nombre completo
        telefono: editData.telefono, // Establecer el estado del teléfono
        avatar_url: avatarUrl // Establecer la url de la imagen
      });

      if (error) {
        Alert.alert('Error', 'No se pudo actualizar el perfil: ' + error); // Mostrar alerta de error
        return;
      }

      // Actualizar el estado local
      setProfile(prev => ({ 
        ...prev,
        nombre_completo: editData.nombre_completo, // Establecer el estado del nombre completo
        telefono: editData.telefono, // Establecer el estado del teléfono
        avatar_url: avatarUrl
      }));

      Alert.alert('Éxito', 'Perfil actualizado correctamente'); // Mostrar alerta de éxito
      setIsEditing(false); // Establecer el estado de edición
      setSelectedImage(null); // Establecer la imagen seleccionada
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
      console.error('Error saving profile:', error); // Mostrar error en la consola
    } finally {
      setSaving(false);
    }
  };

  // Funciones para cambio de contraseña
  const handleChangePassword = () => { // Función para abrir el modal de cambio de contraseña
    if (passwordBlocked) { // Si la contraseña está bloqueada
      Alert.alert('Acceso bloqueado', `Has excedido el número de intentos. Inténtalo de nuevo en ${Math.ceil(blockTimeRemaining / 60)} minutos.`); // Mostrar alerta de acceso bloqueado
      return;
    }
    console.log('Abriendo modal de cambio de contraseña...'); // Mostrar mensaje en la consola
    setShowChangePassword(true); // Establecer el estado de la visualización del modal de cambio de contraseña
    setPasswordData({
      currentPassword: '', // Establecer el estado de la contraseña actual
      newPassword: '', // Establecer el estado de la nueva contraseña
      confirmPassword: '' // Establecer el estado de la confirmación de la nueva contraseña
    });
    setCurrentPasswordValidated(false); // Establecer el estado de la validación de la contraseña actual
    setPasswordValidationErrors([]); // Establecer el estado de los errores de validación de la contraseña
    setCurrentPasswordAttempts(0); // Establecer el contador de intentos de la contraseña actual a 0
    currentPasswordAttemptsRef.current = 0; // Resetear ref al abrir modal
    // No resetear totalFailedAttempts aquí para mantener el conteo entre sesiones
    console.log(`Intentos fallidos totales: ${totalFailedAttemptsRef.current}`); // Debug
  };

  const handleCancelPasswordChange = () => { // Función para cancelar el cambio de contraseña
    setShowChangePassword(false); // Establecer el estado de la visualización del modal de cambio de contraseña
    setPasswordData({
      currentPassword: '', // Establecer el estado de la contraseña actual
      newPassword: '', // Establecer el estado de la nueva contraseña
      confirmPassword: '' // Establecer el estado de la confirmación de la nueva contraseña
    });
    setCurrentPasswordValidated(false); // Establecer el estado de la validación de la contraseña actual
    setPasswordValidationErrors([]); // Establecer el estado de los errores de validación de la contraseña
    // Resetear contadores al cancelar
    setCurrentPasswordAttempts(0); // Establecer el contador de intentos de la contraseña actual a 0
    currentPasswordAttemptsRef.current = 0; // Resetear ref
    // NO resetear totalFailedAttempts aquí para mantener el conteo entre sesiones
    // setTotalFailedAttempts(0); // COMENTADO: mantener conteo persistente
  };

  const handlePasswordInputChange = (field, value) => { // Función para manejar el cambio de input en el modal de cambio de contraseña
    setPasswordData(prev => ({ // Establecer el estado de la contraseña
      ...prev,
      [field]: value // Establecer el valor del input
    }));
    
    // Si es la nueva contraseña, validar en tiempo real solo si ya se validó la actual
    if (field === 'newPassword' && currentPasswordValidated) { // Si es la nueva contraseña y ya se validó la actual
      validateNewPasswordField(value); // Validar la nueva contraseña
    }
  };

  const handleVerifyCurrentPassword = async () => { // Función para verificar la contraseña actual
    if (!passwordData.currentPassword.trim()) { // Si la contraseña actual está vacía
      Alert.alert('Error', 'Por favor ingresa tu contraseña actual'); // Mostrar alerta de error
      return;
    }
    
    if (passwordData.currentPassword.length < 8) { // Si la contraseña actual tiene menos de 8 caracteres
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    try {
      console.log('Verificando contraseña actual...'); // Mostrar mensaje en la consola
      const { data, error } = await validateCurrentPassword(passwordData.currentPassword); // Validar la contraseña actual
      if (data) { // Si la contraseña actual es válida
        console.log('Contraseña validada correctamente, desbloqueando campos...'); // Mostrar mensaje en la consola
        setCurrentPasswordValidated(true); // Establecer el estado de la validación de la contraseña actual
        setCurrentPasswordAttempts(0); // Establecer el contador de intentos de la contraseña actual a 0
        currentPasswordAttemptsRef.current = 0; // Resetear ref
        setPasswordValidationErrors([]); // Establecer el estado de los errores de validación de la contraseña
        Alert.alert('Éxito', 'Contraseña actual verificada correctamente'); // Mostrar alerta de éxito
      } else { // Si la contraseña actual no es válida
        setCurrentPasswordValidated(false); // Establecer el estado de la validación de la contraseña actual
        
        // Usar refs para evitar race conditions
        currentPasswordAttemptsRef.current = currentPasswordAttemptsRef.current + 1;
        totalFailedAttemptsRef.current = totalFailedAttemptsRef.current + 1;
        
        const newAttempts = currentPasswordAttemptsRef.current;
        const newTotalAttempts = totalFailedAttemptsRef.current;
        
        // Actualizar estados UI
        setCurrentPasswordAttempts(newAttempts);
        await saveFailedAttempts(newTotalAttempts);
          
          if (newAttempts >= 3) {
            setPasswordBlocked(true); // Establecer el estado de la contraseña bloqueada
            setBlockTimeRemaining(300); // 5 minutos en segundos
          currentPasswordAttemptsRef.current = 0; // Resetear contador local
          setCurrentPasswordAttempts(0);
            
            // Verificar si es el segundo bloqueo (6 intentos totales)
            if (newTotalAttempts >= 6) {
            // Mostrar alerta ANTES de cerrar sesión
            Alert.alert(
              'Sesión será cerrada por seguridad',
              'Has excedido 6 intentos fallidos. Tu sesión será cerrada por seguridad. Intenta recuperar tu contraseña desde el login.',
              [
                {
                  text: 'Entendido',
                  onPress: async () => {
                    // Limpiar datos del modal
                    setShowChangePassword(false);
                    setCurrentPasswordValidated(false);
                    setPasswordValidationErrors([]);
                setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    await clearFailedAttempts();
                    setTotalFailedAttempts(0);
                    currentPasswordAttemptsRef.current = 0;
                    setCurrentPasswordAttempts(0);
                    setPasswordBlocked(false);
                
                // Cerrar sesión
                    await signOut();
                    
                        // Redirigir al login
                        router.replace('/(auth)');
                      }
                    }
                  ]
                );
            } else {
              // Primer bloqueo (3 intentos), cerrar modal pero mantener sesión
            setTimeout(() => {
              setShowChangePassword(false);
              setCurrentPasswordValidated(false);
              setPasswordValidationErrors([]);
                setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
                });
              }, 2000);
            
            Alert.alert(
              'Acceso bloqueado',
              'Has excedido el número de intentos. El acceso estará bloqueado por 5 minutos.'
            );
          }
          } else {
            Alert.alert(
              'Contraseña incorrecta', 
              `Intentos restantes: ${3 - newAttempts}`
            );
          }
      }
    } catch (error) { 
      console.error('Error validating current password:', error);
      Alert.alert('Error', 'Ocurrió un error al verificar la contraseña');
    }
  };
 
  const validateNewPasswordField = (password) => { // Función para validar la nueva contraseña
    if (!currentPasswordValidated) return; // Si no se ha validado la contraseña actual, no validar la nueva contraseña
    
    const validation = validateNewPassword(password, passwordData.currentPassword); // Validar la nueva contraseña
    setPasswordValidationErrors(validation.errors); // Establecer el estado de los errores de validación de la contraseña
  };

  const togglePasswordVisibility = (field) => { // Función para mostrar/ocultar la contraseña
    setShowPasswords(prev => ({ // Establecer el estado de la visualización de la contraseña
      ...prev,
      [field]: !prev[field] // Establecer el estado de la visualización de la contraseña
    }));
  };

  const handleSavePassword = async () => { // Función para guardar la nueva contraseña
    // Validaciones básicas
    if (!currentPasswordValidated) { // Si no se ha validado la contraseña actual
      Alert.alert('Error', 'Debes validar tu contraseña actual primero'); 
      return;
    }
    if (!passwordData.newPassword.trim()) { // Si la nueva contraseña está vacía
      Alert.alert('Error', 'La nueva contraseña es requerida');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) { // Si las contraseas nuevas no coinciden
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }
    
    // Validar que no haya errores de validación
    if (passwordValidationErrors.length > 0) { // Si hay errores de validación
      Alert.alert('Error', passwordValidationErrors.join('\n'));
      return;
    }

    setPasswordLoading(true);
    try { 
      const { data, error } = await changeClientPassword( // Cambiar la contraseña del cliente
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      if (error) { // Si hay error
        Alert.alert('Error', error); // Mostrar alerta de error
        return;
      }
      
      Alert.alert(
        'Éxito', 
        'Contraseña cambiada correctamente. Serás redirigido al login.',
        [
          {
            text: 'OK',
            onPress: () => { 
              setShowChangePassword(false); // Establecer el estado de la visualización del modal de cambio de contraseña
              setCurrentPasswordValidated(false); // Establecer el estado de la validación de la contraseña actual
              setPasswordValidationErrors([]); // Establecer el estado de los errores de validación de la contraseña
              // Redirigir al login después de cambiar contraseña
              router.replace('/(auth)'); // Redirigir al login
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
      console.error('Error changing password:', error);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Funciones para eliminación de perfil
  const handleDeleteProfile = () => { // Función para eliminar el perfil del cliente
    if (deletePasswordBlocked) { // Si la contraseña de eliminación está bloqueada
      Alert.alert(
        'Acceso bloqueado',
        `Has excedido el número de intentos. Inténtalo de nuevo en ${Math.ceil(deleteBlockTimeRemaining / 60)} minutos.` // Mostrar alerta de acceso bloqueado
      );
      return;
    }
    
    Alert.alert(
      'Eliminar Perfil',
      '¿Estás seguro de que quieres eliminar tu perfil? Esta acción es IRREVERSIBLE y eliminará todos tus datos.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => { 
            setShowDeleteProfile(true); // Establecer el estado de la visualización del modal de eliminación de perfil
            setDeletePasswordData({
              currentPassword: '' // Establecer el estado de la contraseña actual
            });
            setDeletePasswordValidated(false); // Establecer el estado de la validación de la contraseña de eliminación
            setDeletePasswordAttempts(0); // Establecer el contador de intentos de la contraseña de eliminación a 0
            deletePasswordAttemptsRef.current = 0; // Resetear ref local
            // No cargar loadDeleteAttempts porque ahora usamos el contador compartido totalFailedAttempts
          }
        }
      ]
    );
  };

  const handleCancelDeleteProfile = () => { // Función para cancelar la eliminación de perfil
    setShowDeleteProfile(false); // Establecer el estado de la visualización del modal de eliminación de perfil
    setDeletePasswordData({
      currentPassword: '' // Establecer el estado de la contraseña actual
    });
    setDeletePasswordValidated(false); // Establecer el estado de la validación de la contraseña de eliminación
    setDeletePasswordAttempts(0); // Establecer el contador de intentos de la contraseña de eliminación a 0
    deletePasswordAttemptsRef.current = 0; // Resetear ref
    // NO resetear totalDeleteAttempts para mantener el conteo persistente
    // setTotalDeleteAttempts(0); // COMENTADO: mantener conteo persistente
  };

  const handleDeletePasswordInputChange = (value) => { // Función para manejar el cambio de input en el modal de eliminación de perfil
    setDeletePasswordData(prev => ({ // Establecer el estado de la contraseña de eliminación
      ...prev,
      currentPassword: value // Establecer el valor del input
    }));
  };

  const handleVerifyDeletePassword = async () => { // Función para verificar la contraseña de eliminación
    if (!deletePasswordData.currentPassword.trim()) { // Si la contraseña de eliminación está vacía
      Alert.alert('Error', 'Por favor ingresa tu contraseña actual');
      return;
    }
    
    if (deletePasswordData.currentPassword.length < 8) { // Si la contraseña de eliminación tiene menos de 8 caracteres
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    try {
      console.log('Verificando contraseña para eliminación...'); // Mostrar mensaje en la consola
      const { data, error } = await validateCurrentPassword(deletePasswordData.currentPassword); // Validar la contraseña de eliminación
      if (data) {
        console.log('Contraseña validada, procediendo con eliminación...'); // Mostrar mensaje en la consola
        setDeletePasswordValidated(true); // Establecer el estado de la validación de la contraseña de eliminación
        setDeletePasswordAttempts(0); // Establecer el contador de intentos de la contraseña de eliminación a 0
        deletePasswordAttemptsRef.current = 0; // Resetear ref
        await clearDeleteAttempts(); // Limpiar intentos de AsyncStorage
        setTotalDeleteAttempts(0); // Establecer el contador de intentos fallidos de la contraseña de eliminación a 0
        Alert.alert('Éxito', 'Contraseña verificada. Procediendo con la eliminación...');
      } else {
        setDeletePasswordValidated(false); // Establecer el estado de la validación de la contraseña de eliminación
        
        // Usar refs para evitar race conditions
        // COMPARTIR contador total con cambio de contraseña para mejor seguridad
        deletePasswordAttemptsRef.current = deletePasswordAttemptsRef.current + 1;
        totalFailedAttemptsRef.current = totalFailedAttemptsRef.current + 1; // COMPARTIDO
        
        const newAttempts = deletePasswordAttemptsRef.current;
        const newTotalAttempts = totalFailedAttemptsRef.current; // Usar contador compartido
        
        console.log('Nuevos intentos eliminación:', newAttempts, 'Nuevos totales:', newTotalAttempts); // Debug
        
        // Actualizar estados UI
        setDeletePasswordAttempts(newAttempts);
        await saveDeleteAttempts(newTotalAttempts);
        await saveFailedAttempts(newTotalAttempts); // Guardar en contador compartido
        setTotalFailedAttempts(newTotalAttempts); // Actualizar UI del contador compartido
          
          if (newAttempts >= 3) { 
            setDeletePasswordBlocked(true); // Establecer el estado de la contraseña de eliminación bloqueada
            setDeleteBlockTimeRemaining(300); // 5 minutos en segundos
            
            // Verificar si es el segundo bloqueo (6 intentos totales COMPARTIDOS entre cambio y eliminación)
            if (newTotalAttempts >= 6) {
              // Mostrar alerta ANTES de cerrar sesión
              Alert.alert(
                'Sesión será cerrada por seguridad',
                'Has excedido 6 intentos fallidos. Tu sesión será cerrada por seguridad.',
                [
                  {
                    text: 'Entendido',
                    onPress: async () => {
                      // Limpiar datos del modal
                      setShowDeleteProfile(false);
                      setDeletePasswordValidated(false);
                      setDeletePasswordData({
                        currentPassword: ''
                      });
                      await clearDeleteAttempts();
                      await clearFailedAttempts(); // Limpiar contador compartido
                      setTotalFailedAttempts(0);
                      // totalDeleteAttempts eliminado, usar totalFailedAttempts
                      deletePasswordAttemptsRef.current = 0;
                      setDeletePasswordAttempts(0);
                      setDeletePasswordBlocked(false);
                
                // Cerrar sesión
                      await signOut();
                      
                        // Redirigir al login
                        router.replace('/(auth)');
                      }
                    }
                  ]
                );
            } else {
              // Primer bloqueo (3 intentos), cerrar modal pero mantener sesión
              setTimeout(() => {
                setShowDeleteProfile(false);
                setDeletePasswordValidated(false);
                setDeletePasswordData({
                  currentPassword: ''
                });
              }, 2000);
            
            Alert.alert(
              'Acceso bloqueado',
              'Has excedido el número de intentos. El acceso estará bloqueado por 5 minutos.'
            );
            }
          } else {
            Alert.alert(
              'Contraseña incorrecta', 
              `Intentos restantes: ${3 - newAttempts}`
            );
          }
      }
    } catch (error) {
      console.error('Error validating delete password:', error);
      Alert.alert('Error', 'Ocurrió un error al verificar la contraseña');
    }
  };

  const handleConfirmDeleteProfile = async () => { // Función para confirmar la eliminación de perfil
    if (!deletePasswordValidated) { // Si no se ha validado la contraseña de eliminación
      Alert.alert('Error', 'Debes validar tu contraseña actual primero');
      return;
    }

    Alert.alert(
      'Confirmar Eliminación',
      'Esta acción es IRREVERSIBLE. Se eliminarán TODOS tus datos incluyendo:\n\n• Perfil de cliente\n• Avatar e imágenes\n• Productos (si eres artesano)\n• Sesión actual (serás deslogueado)\n\nNota: La cuenta de autenticación permanecerá pero sin datos asociados.\n\n¿Estás completamente seguro?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'ELIMINAR DEFINITIVAMENTE',
          style: 'destructive',
          onPress: async () => {
            setDeletePasswordLoading(true); // Establecer el estado de la carga de la contraseña de eliminación
            try {
              const { data, error } = await deleteClientProfile(deletePasswordData.currentPassword); // Eliminar el perfil del cliente
              
              if (error) {
                Alert.alert('Error', error);
                return;
              }
              
              Alert.alert(
                'Perfil Eliminado',
                'Tu perfil ha sido eliminado completamente. Serás redirigido al login.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Redirigir al login después de eliminar perfil
                      router.replace('/(auth)');
                    }
                  }
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Ocurrió un error inesperado');
              console.error('Error deleting profile:', error);
            } finally {
              setDeletePasswordLoading(false);
            }
          }
        }
      ]
    );
  };

  // Funciones para eliminación de perfil Google
  const handleDeleteGoogleProfile = () => { // Función para eliminar el perfil del cliente
    Alert.alert(
      'Eliminar Perfil (Google)',
      '¿Estás seguro de que quieres eliminar tu perfil? Esta acción es IRREVERSIBLE y eliminará todos tus datos.\n\nComo usuario de Google, no necesitas validar contraseña.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setShowDeleteGoogleProfile(true); // Establecer el estado de la visualización del modal de eliminación de perfil
          }
        }
      ]
    );
  };

  const handleCancelDeleteGoogleProfile = () => { // Función para cancelar la eliminación de perfil
    setShowDeleteGoogleProfile(false); // Establecer el estado de la visualización del modal de eliminación de perfil
  };

  const handleConfirmDeleteGoogleProfile = async () => { // Función para confirmar la eliminación de perfil
    Alert.alert(
      'Confirmar Eliminación (Google)',
      'Esta acción es IRREVERSIBLE. Se eliminarán TODOS tus datos incluyendo:\n\n• Perfil de cliente\n• Avatar e imágenes\n• Productos (si eres artesano)\n• Sesión actual (serás deslogueado)\n\nNota: La cuenta de autenticación permanecerá pero sin datos asociados.\n\n¿Estás completamente seguro?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'ELIMINAR DEFINITIVAMENTE',
          style: 'destructive',
          onPress: async () => {
            setDeleteGoogleLoading(true); // Establecer el estado de la carga de la eliminación de perfil
            try {
              // Llamar a la función de eliminación sin validación de contraseña
              const { data, error } = await deleteGoogleClientProfile(); // Eliminar el perfil del cliente
              
              if (error) {
                Alert.alert('Error', error);
                return;
              }
              
              Alert.alert(
                'Perfil Eliminado',
                'Tu perfil ha sido eliminado completamente. Serás redirigido al login.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Redirigir al login después de eliminar perfil
                      router.replace('/(auth)');
                    }
                  }
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Ocurrió un error inesperado');
              console.error('Error deleting Google profile:', error);
            } finally {
              setDeleteGoogleLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2575fc" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!profile) { // Si no se encontró el perfil
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#db4437" />
        <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return ( // Retornar el componente ScrollView
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={isEditing ? handleSelectImage : undefined} disabled={!isEditing}>
          {isEditing && selectedImage ? (
            <Image source={{ uri: selectedImage.uri }} style={styles.avatar} />
          ) : profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={48} color="#999" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.avatarLabel}>
          {isEditing ? 'Toca para cambiar foto' : 'Foto de perfil'}
        </Text>
      </View>

      {/* Profile Information */}
      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="email" size={20} color="#2575fc" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Correo electrónico</Text>
            <Text style={styles.infoValue}>{profile.email}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="account" size={20} color="#2575fc" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Nombre completo</Text>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={editData.nombre_completo}
                onChangeText={(value) => handleInputChange('nombre_completo', value)}
                placeholder="Nombre completo"
                editable={!saving}
              />
            ) : (
              <Text style={styles.infoValue}>{profile.nombre_completo}</Text>
            )}
          </View>
        </View>

        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="phone" size={20} color="#2575fc" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Teléfono</Text>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={editData.telefono}
                onChangeText={(value) => handleInputChange('telefono', value)}
                placeholder="Teléfono"
                keyboardType="phone-pad"
                editable={!saving}
              />
            ) : (
              <Text style={styles.infoValue}>{profile.telefono}</Text>
            )}
          </View>
        </View>

        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="calendar" size={20} color="#2575fc" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Miembro desde</Text>
            <Text style={styles.infoValue}>
              {new Date(profile.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="update" size={20} color="#28a745" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Última actualización</Text>
            <Text style={styles.infoValue}>
              {new Date(profile.updated_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {isEditing ? (
          <View style={styles.editButtonsContainer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleCancelEdit}
              disabled={saving}
            >
              <MaterialCommunityIcons name="close" size={20} color="#db4437" />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
              <Text style={styles.editButtonText}>Editar perfil</Text>
            </TouchableOpacity>
            
        {/* Botón de cambio de contraseña - Solo visible para usuarios con contraseña (no Google) */}
        {!isGoogleUser && (
          <TouchableOpacity 
            style={[styles.changePasswordButton, passwordBlocked && styles.changePasswordButtonDisabled]} 
            onPress={handleChangePassword}
            disabled={passwordBlocked}
          >
            <MaterialCommunityIcons name="lock-reset" size={20} color="#fff" />
            <Text style={styles.changePasswordButtonText}>
              {passwordBlocked ? `Bloqueado (${Math.ceil(blockTimeRemaining / 60)} min)` : 'Cambiar contraseña'}
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Indicador de intentos fallidos - Solo para usuarios con contraseña */}
        {!isGoogleUser && totalFailedAttempts > 0 && totalFailedAttempts < 6 && (
          <Text style={styles.attemptsWarning}>
            ⚠️ Intentos fallidos: {totalFailedAttempts}/6
          </Text>
        )}
        
        {!isGoogleUser && totalFailedAttempts >= 6 && (
          <Text style={styles.attemptsDanger}>
            🚫 Sesión será cerrada después de 6 intentos fallidos
          </Text>
        )}
        
        {/* Botón de eliminar perfil - Solo visible para usuarios con contraseña (no Google) */}
        {!isGoogleUser && (
          <TouchableOpacity 
            style={[styles.deleteProfileButton, deletePasswordBlocked && styles.deleteProfileButtonDisabled]} 
            onPress={handleDeleteProfile}
            disabled={deletePasswordBlocked}
          >
            <MaterialCommunityIcons name="delete-forever" size={20} color="#fff" />
            <Text style={styles.deleteProfileButtonText}>
              {deletePasswordBlocked ? `Bloqueado (${Math.ceil(deleteBlockTimeRemaining / 60)} min)` : 'Eliminar perfil'}
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Botón de eliminar perfil (Google) - Solo visible para usuarios de Google */}
        {isGoogleUser && (
          <TouchableOpacity 
            style={styles.deleteGoogleProfileButton} 
            onPress={handleDeleteGoogleProfile}
          >
            <MaterialCommunityIcons name="google" size={20} color="#fff" />
            <Text style={styles.deleteGoogleProfileButtonText}>
              Eliminar perfil (Google)
            </Text>
          </TouchableOpacity>
        )}
        
        {/* NOTA: totalDeleteAttempts DEPRECATED - usar totalFailedAttempts (compartido con cambio de contraseña) */}
        
        {/* Botón de cerrar sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modal de cambio de contraseña - Usando componente reutilizable */}
      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={() => {
          // Limpiar estados locales al cerrar
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setCurrentPasswordValidated(false);
          setPasswordValidationErrors([]);
          setCurrentPasswordAttempts(0);
          // Redirigir al login después de cambiar contraseña
          router.replace('/(auth)');
        }}
      />

      {/* Modal de eliminación de perfil */}
      {showDeleteProfile && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Eliminar Perfil</Text>
              <TouchableOpacity 
                onPress={handleCancelDeleteProfile}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.deleteForm}>
              <Text style={styles.deleteWarning}>
                ⚠️ Esta acción es IRREVERSIBLE
              </Text>
              <Text style={styles.deleteDescription}>
                Se eliminarán TODOS tus datos incluyendo:
              </Text>
              <Text style={styles.deleteList}>
                • Perfil de cliente{'\n'}
                • Avatar e imágenes{'\n'}
                • Productos (si eres artesano){'\n'}
                • Sesión actual (serás deslogueado){'\n'}
                {'\n'}Nota: La cuenta de autenticación permanecerá pero sin datos asociados.
              </Text>
              
              {/* Contraseña actual para eliminación */}
              <View style={styles.passwordInputContainer}>
                <Text style={styles.passwordLabel}>
                  Contraseña actual
                  {deletePasswordValidated && (
                    <Text style={styles.validationSuccess}> ✓</Text>
                  )}
                </Text>
                <View style={[
                  styles.passwordInputWrapper,
                  deletePasswordValidated && styles.passwordInputValid,
                  deletePasswordAttempts > 0 && !deletePasswordValidated && styles.passwordInputError
                ]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Ingresa tu contraseña actual"
                    value={deletePasswordData.currentPassword}
                    onChangeText={handleDeletePasswordInputChange}
                    secureTextEntry={!showDeletePassword}
                    editable={!deletePasswordLoading && !deletePasswordValidated}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowDeletePassword(!showDeletePassword)}
                    style={styles.eyeButton}
                  >
                    <MaterialCommunityIcons 
                      name={showDeletePassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
                
                {/* Botón de verificación para eliminación */}
                {!deletePasswordValidated && (
                  <TouchableOpacity 
                    style={styles.verifyButton}
                    onPress={handleVerifyDeletePassword}
                    disabled={deletePasswordLoading || !deletePasswordData.currentPassword.trim()}
                  >
                    <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                    <Text style={styles.verifyButtonText}>Verificar contraseña</Text>
                  </TouchableOpacity>
                )}
                
                {deletePasswordAttempts > 0 && !deletePasswordValidated && (
                    <Text style={styles.errorTextSmall}>
                      Contraseña incorrecta. Intentos restantes: {3 - deletePasswordAttempts}
                    </Text>
                  )}
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelDeleteProfile}
                disabled={deletePasswordLoading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.deleteConfirmButton, !deletePasswordValidated && styles.deleteConfirmButtonDisabled]}
                onPress={handleConfirmDeleteProfile}
                disabled={!deletePasswordValidated || deletePasswordLoading}
              >
                {deletePasswordLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="delete-forever" size={20} color="#fff" />
                    <Text style={styles.deleteConfirmButtonText}>ELIMINAR DEFINITIVAMENTE</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal de eliminación de perfil Google */}
      {showDeleteGoogleProfile && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Eliminar Perfil (Google)</Text>
              <TouchableOpacity 
                onPress={handleCancelDeleteGoogleProfile}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.deleteForm}>
              <Text style={styles.deleteWarning}>
                ⚠️ Esta acción es IRREVERSIBLE
              </Text>
              <Text style={styles.deleteDescription}>
                Se eliminarán TODOS tus datos incluyendo:
              </Text>
              <Text style={styles.deleteList}>
                • Perfil de cliente{'\n'}
                • Avatar e imágenes{'\n'}
                • Productos (si eres artesano){'\n'}
                • Sesión actual (serás deslogueado){'\n'}
                {'\n'}Nota: La cuenta de autenticación permanecerá pero sin datos asociados.
              </Text>
              
              <Text style={styles.googleWarning}>
                🔐 Como usuario de Google, no necesitas validar contraseña.
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelDeleteGoogleProfile}
                disabled={deleteGoogleLoading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.deleteConfirmButton, deleteGoogleLoading && styles.deleteConfirmButtonDisabled]}
                onPress={handleConfirmDeleteGoogleProfile}
                disabled={deleteGoogleLoading}
              >
                {deleteGoogleLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="google" size={20} color="#fff" />
                    <Text style={styles.deleteConfirmButtonText}>ELIMINAR (GOOGLE)</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#db4437',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2575fc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#2575fc',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2575fc',
  },
  avatarLabel: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  infoSection: {
    backgroundColor: '#fff',
    marginBottom: 20,
    paddingVertical: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  editButton: {
    backgroundColor: '#2575fc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    marginTop: 4,
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#db4437',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: '#db4437',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Estilos para cambio de contraseña
  actionButtonsContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  changePasswordButton: {
    backgroundColor: '#ff6b35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  changePasswordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Estilos del modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  passwordForm: {
    marginBottom: 20,
  },
  passwordInputContainer: {
    marginBottom: 15,
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelPasswordButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#db4437',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelPasswordButtonText: {
    color: '#db4437',
    fontSize: 16,
    fontWeight: 'bold',
  },
  savePasswordButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  savePasswordButtonDisabled: {
    backgroundColor: '#ccc',
  },
  savePasswordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos para validaciones
  changePasswordButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  passwordInputValid: {
    borderColor: '#28a745',
    borderWidth: 2,
  },
  passwordInputError: {
    borderColor: '#dc3545',
    borderWidth: 2,
  },
  passwordInputDisabled: {
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
    opacity: 0.6,
  },
  validationSuccess: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  validationWarning: {
    color: '#ffc107',
    fontSize: 12,
    fontWeight: '500',
  },
  errorTextSmall: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  validationErrorsContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8d7da',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  validationErrorText: {
    color: '#721c24',
    fontSize: 12,
    marginBottom: 2,
  },
  // Estilos para botón de verificación
  verifyButton: {
    backgroundColor: '#007bff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Estilos para indicadores de intentos
  attemptsWarning: {
    color: '#ffc107',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  attemptsDanger: {
    color: '#dc3545',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    backgroundColor: '#f8d7da',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  // Estilos para botón de eliminar perfil
  deleteProfileButton: {
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  deleteProfileButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  deleteProfileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Estilos para modal de eliminación
  deleteForm: {
    padding: 20,
  },
  deleteWarning: {
    color: '#dc3545',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  deleteDescription: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  deleteList: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  deleteConfirmButton: {
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  deleteConfirmButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  deleteConfirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Estilos para botón de eliminar perfil Google
  deleteGoogleProfileButton: {
    backgroundColor: '#4285f4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  deleteGoogleProfileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Estilos para botón de cerrar sesión
  logoutButton: {
    backgroundColor: '#db4437',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Estilos para advertencia de Google
  googleWarning: {
    color: '#4285f4',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
});