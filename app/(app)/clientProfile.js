// app/(app)/ClientProfile.js
// Perfil del cliente con edición, cambio de contraseña y eliminación de perfil   
import React, { useState, useEffect, useRef } from 'react';
import { View, Text as DefaultText, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useCustomFonts from '../../hooks/useFonts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/supabase/client';
import { 
  getClientProfile, 
  editClientProfile, 
  uploadAvatar, 
  changeClientPassword, 
  validateCurrentPassword, 
  validateNewPassword, 
  deleteClientProfile, 
  deleteGoogleClientProfile 
} from '../../src/services/profileInfo';
import { useAuth } from '../../src/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import { FontDisplay } from 'expo-font';

// Componente Text personalizado con la fuente AlanSans
const Text = (props) => (
  <DefaultText {...props} style={[{ fontFamily: 'AlanSans' }, props.style]} />
);

export default function ClientProfile() {
  const { signOut } = useAuth();
  const fontsLoaded = useCustomFonts();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nombre_completo: '',
    telefono: '',
    avatar_url: null
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [saving, setSaving] = useState(false);

  // Estados para cambio de contraseña
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [currentPasswordValidated, setCurrentPasswordValidated] = useState(false);
  const [currentPasswordAttempts, setCurrentPasswordAttempts] = useState(0);
  const [passwordBlocked, setPasswordBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [passwordValidationErrors, setPasswordValidationErrors] = useState([]);
  const [totalFailedAttempts, setTotalFailedAttempts] = useState(0);

  // Refs para evitar race conditions
  const totalFailedAttemptsRef = useRef(0);
  const currentPasswordAttemptsRef = useRef(0);
  const deletePasswordAttemptsRef = useRef(0);

  // Estados para eliminación de perfil
  const [showDeleteProfile, setShowDeleteProfile] = useState(false);
  const [deletePasswordData, setDeletePasswordData] = useState({
    currentPassword: ''
  });
  const [deletePasswordLoading, setDeletePasswordLoading] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletePasswordValidated, setDeletePasswordValidated] = useState(false);
  const [deletePasswordAttempts, setDeletePasswordAttempts] = useState(0);
  const [deletePasswordBlocked, setDeletePasswordBlocked] = useState(false);
  const [deleteBlockTimeRemaining, setDeleteBlockTimeRemaining] = useState(0);
  const [totalDeleteAttempts, setTotalDeleteAttempts] = useState(0);

  // Estados para eliminación de perfil Google
  const [showDeleteGoogleProfile, setShowDeleteGoogleProfile] = useState(false);
  const [deleteGoogleLoading, setDeleteGoogleLoading] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  const router = useRouter();

  // Funciones de carga y validación
  const loadFailedAttempts = async () => {
    try {
      const attempts = await AsyncStorage.getItem('passwordFailedAttempts');
      if (attempts !== null) {
        const parsedAttempts = parseInt(attempts);
        setTotalFailedAttempts(parsedAttempts);
        totalFailedAttemptsRef.current = parsedAttempts;
      }
    } catch (error) {
    }
  };

  const saveFailedAttempts = async (attempts) => {
    try {
      await AsyncStorage.setItem('passwordFailedAttempts', attempts.toString());
      totalFailedAttemptsRef.current = attempts;
      setTotalFailedAttempts(attempts);
    } catch (error) {
    }
  };

  const clearFailedAttempts = async () => {
    try {
      await AsyncStorage.removeItem('passwordFailedAttempts');
      totalFailedAttemptsRef.current = 0;
      setTotalFailedAttempts(0);
    } catch (error) {
    }
  };

  const loadDeleteAttempts = async () => {
    try {
      const attempts = await AsyncStorage.getItem('deleteFailedAttempts');
      if (attempts !== null) {
        const parsedAttempts = parseInt(attempts);
        setTotalDeleteAttempts(parsedAttempts);
        deletePasswordAttemptsRef.current = parsedAttempts;
      }
    } catch (error) {
    }
  };

  const saveDeleteAttempts = async (attempts) => {
    try {
      await AsyncStorage.setItem('deleteFailedAttempts', attempts.toString());
      deletePasswordAttemptsRef.current = attempts;
      setTotalDeleteAttempts(attempts);
    } catch (error) {
    }
  };

  const clearDeleteAttempts = async () => {
    try {
      await AsyncStorage.removeItem('deleteFailedAttempts');
      deletePasswordAttemptsRef.current = 0;
      setTotalDeleteAttempts(0);
    } catch (error) {
    }
  };

  useEffect(() => {
    fetchProfile();
    checkUserProvider();
    loadFailedAttempts();
    loadDeleteAttempts();
  }, []);

  useEffect(() => {
    let interval;
    if (passwordBlocked && blockTimeRemaining > 0) {
      interval = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1) {
            setPasswordBlocked(false);
            setCurrentPasswordAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [passwordBlocked, blockTimeRemaining]);

  useEffect(() => {
    let interval;
    if (deletePasswordBlocked && deleteBlockTimeRemaining > 0) {
      interval = setInterval(() => {
        setDeleteBlockTimeRemaining(prev => {
          if (prev <= 1) {
            setDeletePasswordBlocked(false);
            setDeletePasswordAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [deletePasswordBlocked, deleteBlockTimeRemaining]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'No se encontró la sesión del usuario');
        return;
      }
      const { data, error } = await getClientProfile(user.id);
      if (error) {
        Alert.alert('Error', 'No se pudo cargar el perfil: ' + error);
        return;
      }
      setProfile(data);
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const checkUserProvider = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.app_metadata && user.app_metadata.provider) {
        setIsGoogleUser(user.app_metadata.provider === 'google');
      }
    } catch (error) {
    }
  };

  const handleLogout = async () => {
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
        quality: 0.8, // Calidad de la imagen
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
      const { data, error } = await validateCurrentPassword(passwordData.currentPassword); // Validar la contraseña actual
      if (data) { // Si la contraseña actual es válida
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
      const { data, error } = await validateCurrentPassword(deletePasswordData.currentPassword); // Validar la contraseña de eliminación
      if (data) {
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
            await signOut();
          }
        }
      ]
    );
  };

  const navigateToProfile = () => {
    router.push('/clientProfile');
  };

  const navigateToAccountManagement = () => {
    Alert.alert('Próximamente', 'Esta función estará disponible pronto');
  };

  const navigateToNotifications = () => {
    Alert.alert('Próximamente', 'Esta función estará disponible pronto');
  };

  const navigateToAppSettings = () => {
    Alert.alert('Próximamente', 'Esta función estará disponible pronto');
  };

  const navigateToHelpAndSupport = () => {
    Alert.alert('Próximamente', 'Esta función estará disponible pronto');
  };

  const navigateToTermsAndConditions = () => {
    Alert.alert('Próximamente', 'Esta función estará disponible pronto');
  };

  // Primero verifica si las fuentes están cargadas
  if (!fontsLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2575fc" />
        <Text className="mt-3 text-sm text-gray-600">Cargando...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2575fc" />
        <Text className="mt-3 text-sm text-gray-600">Cargando perfil...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-4">
        <MaterialCommunityIcons name="alert-circle" size={48} color="#db4437" />
        <Text className="mt-4 text-lg font-semibold text-red-600 text-center">No se pudo cargar el perfil</Text>
        <TouchableOpacity 
          className="mt-4 bg-blue-500 py-2 px-6 rounded-lg"
          onPress={fetchProfile}
        >
          <Text className="text-white font-bold">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white py-4 px-4 flex-row items-center justify-between border-b border-gray-200">
        <TouchableOpacity className="p-2" onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={{fontFamily: 'Alan Sans', fontSize:24, fontWeight: 'bold'}} className="text-2xl text-gray-700">Mi Cuenta</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Sección de Perfil */}
      <View className="bg-white p-4 mb-4">
        <TouchableOpacity className="flex-row items-center" onPress={navigateToProfile}>
          <View className="w-12 h-12 bg-gray-300 rounded-full mr-3 justify-center items-center">
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} className="w-12 h-12 rounded-full" />
            ) : (
              <MaterialCommunityIcons name="account" size={24} color="#666"/>
            )}
          </View>
          <View className="flex-1">
            <Text style={{fontFamily: 'Alan Sans', fontSize:20,}} className="text-base font-semibold text-gray-900">{profile.nombre_completo}</Text>
            <Text style={{fontFamily: 'Alan Sans', fontSize:15}} className=" text-[#9D046D] text-semibold">Ver mi perfil</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Sección Gestión */}
      <View className="bg-white mb-4">
        <View className="px-4 py-3 border-b border-gray-200">
          <Text style={{fontFamily: 'Alan Sans', fontSize:20,}} className="text-lg font-bold text-gray-700">Gestión</Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center px-4 py-3 border-b border-gray-200"
          onPress={navigateToAccountManagement}
        >
          <View className="w-12 h-12 bg-[#00000012] rounded-full mr-3 justify-center items-center">
            <MaterialCommunityIcons name="account-circle-outline" size={26} color="#000" />
          </View>
          <View className="flex-1">
            <Text style={{fontFamily: 'Alan Sans', fontSize:15,}} className="font-bold text-gray-900">Gestión de la Cuenta</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-4 py-3 border-b border-gray-200"
          onPress={navigateToNotifications}
        >
          <View className="w-12 h-12 bg-[#00000012] rounded-full mr-3 justify-center items-center">
            <MaterialCommunityIcons name="bell-ring-outline" size={26} color="#000" />
          </View>
          <View className="flex-1">
            <Text style={{fontFamily: 'Alan Sans', fontSize:15,}} className="font-bold text-gray-900">Notificaciones</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-4 py-3"
          onPress={navigateToAppSettings}
        >
          <View className="w-12 h-12 bg-[#00000012] rounded-full mr-3 justify-center items-center">
            <MaterialCommunityIcons name="tune" size={26} color="#000" />
          </View>
          <View className="flex-1">
            <Text style={{fontFamily: 'Alan Sans', fontSize:15,}} className="font-bold text-gray-900">Configuración de la App</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Sección Soporte */}
      <View className="bg-white mb-4">
        <View className="px-4 py-3 border-b border-gray-200">
          <Text style={{fontFamily: 'Alan Sans', fontSize:20,}} className="text-lg font-bold text-gray-700">Soporte</Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center px-4 py-3 border-b border-gray-200"
          onPress={navigateToHelpAndSupport}
        >
          <View className="w-12 h-12 bg-[#00000012] rounded-full mr-3 justify-center items-center">
            <MaterialCommunityIcons name="information-outline" size={26} color="#000" />
          </View>
          <View className="flex-1">
            <Text style={{fontFamily: 'Alan Sans', fontSize:15,}} className="font-bold text-gray-900">Ayuda y Soporte</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-4 py-3"
          onPress={navigateToTermsAndConditions}
        >
          <View className="w-12 h-12 bg-[#00000012] rounded-full mr-3 justify-center items-center">
            <MaterialCommunityIcons name="file-document-outline" size={26} color="#000" />
          </View>
          <View className="flex-1">
            <Text style={{fontFamily: 'Alan Sans', fontSize:15,}} className="font-bold text-gray-900">Términos y Condiciones</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Botón de Cerrar Sesión */}
      <View className="px-4 pb-6">
        <TouchableOpacity
          className="py-3 px-4 bg-[#E8C6E8] rounded-xl flex-row items-center border-[#9D046D] justify-center"
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#9D046D" />
          <Text style={{fontFamily: 'Alan Sans', fontSize:20,}} className="ml-2 font-bold text-[#9D046D]">Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// 👇 ESTA LÍNEA ES CRUCIAL PARA EVITAR EL ERROR DE EXPO ROUTER 👇
ClientProfile.displayName = 'ClientProfile';