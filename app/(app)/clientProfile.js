import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  TouchableOpacity,
  Image,
  TextInput
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/supabase/client';
import { getClientProfile, editClientProfile, uploadAvatar, changeClientPassword, validateCurrentPassword, validateNewPassword, deleteClientProfile, deleteGoogleClientProfile } from '../../src/services/profileInfo';
import { useAuth } from '../../src/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

export default function ClientProfile() {
  const { signOut } = useAuth();
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
  
  // Estados para validaciones de seguridad
  const [currentPasswordValidated, setCurrentPasswordValidated] = useState(false);
  const [currentPasswordAttempts, setCurrentPasswordAttempts] = useState(0);
  const [passwordBlocked, setPasswordBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [passwordValidationErrors, setPasswordValidationErrors] = useState([]);
  const [totalFailedAttempts, setTotalFailedAttempts] = useState(0);
  
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

  useEffect(() => {
    fetchProfile();
    checkUserProvider();
  }, []);

  // useEffect para manejar el contador de bloqueo
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

  // Timer para bloqueo de eliminación de perfil
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
      
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'No se encontró la sesión del usuario');
        return;
      }

      // Obtener perfil del cliente
      const { data, error } = await getClientProfile(user.id);
      
      if (error) {
        Alert.alert('Error', 'No se pudo cargar el perfil: ' + error);
        return;
      }

      setProfile(data);
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
      console.error('Error fetching profile:', error);
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
      console.error('Error checking user provider:', error);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleEdit = () => {
    setEditData({
      nombre_completo: profile.nombre_completo,
      telefono: profile.telefono,
      avatar_url: profile.avatar_url
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      nombre_completo: '',
      telefono: '',
      avatar_url: null
    });
    setSelectedImage(null);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería para seleccionar una foto');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
        setEditData(prev => ({
          ...prev,
          avatar_url: result.assets[0].uri
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleSave = async () => {
    if (!editData.nombre_completo.trim()) {
      Alert.alert('Error', 'El nombre completo es requerido');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'No se encontró la sesión del usuario');
        return;
      }

      let avatarUrl = editData.avatar_url;

      // Si se seleccionó una nueva imagen, subirla
      if (selectedImage) {
        const { data: uploadedUrl, error: uploadError } = await uploadAvatar(user.id, selectedImage);
        if (uploadError) {
          Alert.alert('Error', 'No se pudo subir la imagen: ' + uploadError);
          return;
        }
        avatarUrl = uploadedUrl;
      }

      // Actualizar perfil
      const { data, error } = await editClientProfile(user.id, {
        nombre_completo: editData.nombre_completo,
        telefono: editData.telefono,
        avatar_url: avatarUrl
      });

      if (error) {
        Alert.alert('Error', 'No se pudo actualizar el perfil: ' + error);
        return;
      }

      // Actualizar el estado local
      setProfile(prev => ({
        ...prev,
        nombre_completo: editData.nombre_completo,
        telefono: editData.telefono,
        avatar_url: avatarUrl
      }));

      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setIsEditing(false);
      setSelectedImage(null);
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  // Funciones para cambio de contraseña
  const handleChangePassword = () => {
    if (passwordBlocked) {
      Alert.alert(
        'Acceso bloqueado',
        `Has excedido el número de intentos. Inténtalo de nuevo en ${Math.ceil(blockTimeRemaining / 60)} minutos.`
      );
      return;
    }
    
    console.log('Abriendo modal de cambio de contraseña...');
    setShowChangePassword(true);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setCurrentPasswordValidated(false);
    setPasswordValidationErrors([]);
    setCurrentPasswordAttempts(0);
    // No resetear totalFailedAttempts aquí para mantener el conteo entre sesiones
  };

  const handleCancelPasswordChange = () => {
    setShowChangePassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setCurrentPasswordValidated(false);
    setPasswordValidationErrors([]);
    // Resetear contadores al cancelar
    setCurrentPasswordAttempts(0);
    setTotalFailedAttempts(0);
  };

  const handlePasswordInputChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Si es la nueva contraseña, validar en tiempo real solo si ya se validó la actual
    if (field === 'newPassword' && currentPasswordValidated) {
      validateNewPasswordField(value);
    }
  };

  const handleVerifyCurrentPassword = async () => {
    if (!passwordData.currentPassword.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu contraseña actual');
      return;
    }
    
    if (passwordData.currentPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      console.log('Verificando contraseña actual...');
      const { data, error } = await validateCurrentPassword(passwordData.currentPassword);
      if (data) {
        console.log('Contraseña validada correctamente, desbloqueando campos...');
        setCurrentPasswordValidated(true);
        setCurrentPasswordAttempts(0);
        setPasswordValidationErrors([]);
        Alert.alert('Éxito', 'Contraseña actual verificada correctamente');
      } else {
        setCurrentPasswordValidated(false);
        setCurrentPasswordAttempts(prev => {
          const newAttempts = prev + 1;
          const newTotalAttempts = totalFailedAttempts + 1;
          setTotalFailedAttempts(newTotalAttempts);
          
          if (newAttempts >= 3) {
            setPasswordBlocked(true);
            setBlockTimeRemaining(300); // 5 minutos en segundos
            
            // Verificar si es el segundo bloqueo (6 intentos totales)
            if (newTotalAttempts >= 6) {
              // Cerrar sesión automáticamente después de 6 intentos fallidos
              setTimeout(() => {
                setShowChangePassword(false);
                setCurrentPasswordValidated(false);
                setPasswordValidationErrors([]);
                setPasswordData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                });
                setTotalFailedAttempts(0);
                setCurrentPasswordAttempts(0);
                setPasswordBlocked(false);
                
                // Cerrar sesión
                signOut();
                
                Alert.alert(
                  'Sesión cerrada por seguridad',
                  'Has excedido 6 intentos fallidos. Tu sesión ha sido cerrada por seguridad. Intenta recuperar tu contraseña desde el login.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Redirigir al login
                        router.replace('/(auth)');
                      }
                    }
                  ]
                );
              }, 2000);
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
            }
            
            Alert.alert(
              'Acceso bloqueado',
              'Has excedido el número de intentos. El acceso estará bloqueado por 5 minutos.'
            );
          } else {
            Alert.alert(
              'Contraseña incorrecta', 
              `Intentos restantes: ${3 - newAttempts}`
            );
          }
          return newAttempts;
        });
      }
    } catch (error) {
      console.error('Error validating current password:', error);
      Alert.alert('Error', 'Ocurrió un error al verificar la contraseña');
    }
  };

  const validateNewPasswordField = (password) => {
    if (!currentPasswordValidated) return;
    
    const validation = validateNewPassword(password, passwordData.currentPassword);
    setPasswordValidationErrors(validation.errors);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSavePassword = async () => {
    // Validaciones básicas
    if (!currentPasswordValidated) {
      Alert.alert('Error', 'Debes validar tu contraseña actual primero');
      return;
    }
    if (!passwordData.newPassword.trim()) {
      Alert.alert('Error', 'La nueva contraseña es requerida');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }
    
    // Validar que no haya errores de validación
    if (passwordValidationErrors.length > 0) {
      Alert.alert('Error', passwordValidationErrors.join('\n'));
      return;
    }

    setPasswordLoading(true);
    try {
      const { data, error } = await changeClientPassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      if (error) {
        Alert.alert('Error', error);
        return;
      }
      
      Alert.alert(
        'Éxito', 
        'Contraseña cambiada correctamente. Serás redirigido al login.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowChangePassword(false);
              setCurrentPasswordValidated(false);
              setPasswordValidationErrors([]);
              // Redirigir al login después de cambiar contraseña
              router.replace('/(auth)');
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
  const handleDeleteProfile = () => {
    if (deletePasswordBlocked) {
      Alert.alert(
        'Acceso bloqueado',
        `Has excedido el número de intentos. Inténtalo de nuevo en ${Math.ceil(deleteBlockTimeRemaining / 60)} minutos.`
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
          onPress: () => {
            setShowDeleteProfile(true);
            setDeletePasswordData({
              currentPassword: ''
            });
            setDeletePasswordValidated(false);
            setDeletePasswordAttempts(0);
          }
        }
      ]
    );
  };

  const handleCancelDeleteProfile = () => {
    setShowDeleteProfile(false);
    setDeletePasswordData({
      currentPassword: ''
    });
    setDeletePasswordValidated(false);
    setDeletePasswordAttempts(0);
    setTotalDeleteAttempts(0);
  };

  const handleDeletePasswordInputChange = (value) => {
    setDeletePasswordData(prev => ({
      ...prev,
      currentPassword: value
    }));
  };

  const handleVerifyDeletePassword = async () => {
    if (!deletePasswordData.currentPassword.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu contraseña actual');
      return;
    }
    
    if (deletePasswordData.currentPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      console.log('Verificando contraseña para eliminación...');
      const { data, error } = await validateCurrentPassword(deletePasswordData.currentPassword);
      if (data) {
        console.log('Contraseña validada, procediendo con eliminación...');
        setDeletePasswordValidated(true);
        setDeletePasswordAttempts(0);
        setTotalDeleteAttempts(0);
        Alert.alert('Éxito', 'Contraseña verificada. Procediendo con la eliminación...');
      } else {
        setDeletePasswordValidated(false);
        setDeletePasswordAttempts(prev => {
          const newAttempts = prev + 1;
          const newTotalAttempts = totalDeleteAttempts + 1;
          setTotalDeleteAttempts(newTotalAttempts);
          
          if (newAttempts >= 3) {
            setDeletePasswordBlocked(true);
            setDeleteBlockTimeRemaining(300); // 5 minutos en segundos
            
            // Verificar si es el segundo bloqueo (6 intentos totales)
            if (newTotalAttempts >= 6) {
              // Cerrar sesión automáticamente después de 6 intentos fallidos
              setTimeout(() => {
                setShowDeleteProfile(false);
                setDeletePasswordValidated(false);
                setDeletePasswordData({
                  currentPassword: ''
                });
                setTotalDeleteAttempts(0);
                setDeletePasswordAttempts(0);
                setDeletePasswordBlocked(false);
                
                // Cerrar sesión
                signOut();
                
                Alert.alert(
                  'Sesión cerrada por seguridad',
                  'Has excedido 6 intentos fallidos. Tu sesión ha sido cerrada por seguridad.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Redirigir al login
                        router.replace('/(auth)');
                      }
                    }
                  ]
                );
              }, 2000);
            } else {
              // Primer bloqueo (3 intentos), cerrar modal pero mantener sesión
              setTimeout(() => {
                setShowDeleteProfile(false);
                setDeletePasswordValidated(false);
                setDeletePasswordData({
                  currentPassword: ''
                });
              }, 2000);
            }
            
            Alert.alert(
              'Acceso bloqueado',
              'Has excedido el número de intentos. El acceso estará bloqueado por 5 minutos.'
            );
          } else {
            Alert.alert(
              'Contraseña incorrecta', 
              `Intentos restantes: ${3 - newAttempts}`
            );
          }
          return newAttempts;
        });
      }
    } catch (error) {
      console.error('Error validating delete password:', error);
      Alert.alert('Error', 'Ocurrió un error al verificar la contraseña');
    }
  };

  const handleConfirmDeleteProfile = async () => {
    if (!deletePasswordValidated) {
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
            setDeletePasswordLoading(true);
            try {
              const { data, error } = await deleteClientProfile(deletePasswordData.currentPassword);
              
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
  const handleDeleteGoogleProfile = () => {
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
            setShowDeleteGoogleProfile(true);
          }
        }
      ]
    );
  };

  const handleCancelDeleteGoogleProfile = () => {
    setShowDeleteGoogleProfile(false);
  };

  const handleConfirmDeleteGoogleProfile = async () => {
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
            setDeleteGoogleLoading(true);
            try {
              // Llamar a la función de eliminación sin validación de contraseña
              const { data, error } = await deleteGoogleClientProfile();
              
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

  if (!profile) {
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

  return (
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
        
        {/* Indicador de intentos fallidos para eliminación - Solo para usuarios con contraseña */}
        {!isGoogleUser && totalDeleteAttempts > 0 && totalDeleteAttempts < 6 && (
          <Text style={styles.attemptsWarning}>
            ⚠️ Intentos fallidos eliminación: {totalDeleteAttempts}/6
          </Text>
        )}
        
        {!isGoogleUser && totalDeleteAttempts >= 6 && (
          <Text style={styles.attemptsDanger}>
            🚫 Sesión será cerrada después de 6 intentos fallidos
          </Text>
        )}
          </View>
        )}
      </View>

      {/* Modal de cambio de contraseña */}
      {showChangePassword && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar contraseña</Text>
              <TouchableOpacity onPress={handleCancelPasswordChange}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.passwordForm}>
              {/* Contraseña actual */}
              <View style={styles.passwordInputContainer}>
                <Text style={styles.passwordLabel}>
                  Contraseña actual
                  {currentPasswordValidated && (
                    <Text style={styles.validationSuccess}> ✓</Text>
                  )}
                </Text>
                <View style={[
                  styles.passwordInputWrapper,
                  currentPasswordValidated && styles.passwordInputValid,
                  currentPasswordAttempts > 0 && !currentPasswordValidated && styles.passwordInputError
                ]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Ingresa tu contraseña actual"
                    value={passwordData.currentPassword}
                    onChangeText={(value) => handlePasswordInputChange('currentPassword', value)}
                    secureTextEntry={!showPasswords.current}
                    editable={!passwordLoading && !currentPasswordValidated}
                  />
                  <TouchableOpacity 
                    onPress={() => togglePasswordVisibility('current')}
                    style={styles.eyeButton}
                  >
                    <MaterialCommunityIcons 
                      name={showPasswords.current ? "eye-off" : "eye"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
                
                {/* Botón de verificación */}
                {!currentPasswordValidated && (
                  <TouchableOpacity 
                    style={styles.verifyButton}
                    onPress={handleVerifyCurrentPassword}
                    disabled={passwordLoading || !passwordData.currentPassword.trim()}
                  >
                    <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                    <Text style={styles.verifyButtonText}>Verificar contraseña</Text>
                  </TouchableOpacity>
                )}
                
                {currentPasswordAttempts > 0 && !currentPasswordValidated && (
                  <Text style={styles.errorText}>
                    Contraseña incorrecta. Intentos restantes: {3 - currentPasswordAttempts}
                  </Text>
                )}
              </View>

              {/* Nueva contraseña */}
              <View style={styles.passwordInputContainer}>
                <Text style={styles.passwordLabel}>
                  Nueva contraseña
                  {!currentPasswordValidated && (
                    <Text style={styles.validationWarning}> (Bloqueado hasta validar contraseña actual)</Text>
                  )}
                </Text>
                <View style={[
                  styles.passwordInputWrapper,
                  !currentPasswordValidated && styles.passwordInputDisabled
                ]}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      !currentPasswordValidated && styles.passwordInputDisabled
                    ]}
                    placeholder={currentPasswordValidated ? "Ingresa tu nueva contraseña" : "Primero valida tu contraseña actual"}
                    value={passwordData.newPassword}
                    onChangeText={(value) => handlePasswordInputChange('newPassword', value)}
                    secureTextEntry={!showPasswords.new}
                    editable={currentPasswordValidated && !passwordLoading}
                  />
                  <TouchableOpacity 
                    onPress={() => togglePasswordVisibility('new')}
                    style={styles.eyeButton}
                    disabled={!currentPasswordValidated}
                  >
                    <MaterialCommunityIcons 
                      name={showPasswords.new ? "eye-off" : "eye"} 
                      size={20} 
                      color={currentPasswordValidated ? "#666" : "#ccc"} 
                    />
                  </TouchableOpacity>
                </View>
                {passwordValidationErrors.length > 0 && currentPasswordValidated && (
                  <View style={styles.validationErrorsContainer}>
                    {passwordValidationErrors.map((error, index) => (
                      <Text key={index} style={styles.validationErrorText}>• {error}</Text>
                    ))}
                  </View>
                )}
              </View>

              {/* Confirmar contraseña */}
              <View style={styles.passwordInputContainer}>
                <Text style={styles.passwordLabel}>
                  Confirmar nueva contraseña
                  {!currentPasswordValidated && (
                    <Text style={styles.validationWarning}> (Bloqueado hasta validar contraseña actual)</Text>
                  )}
                </Text>
                <View style={[
                  styles.passwordInputWrapper,
                  !currentPasswordValidated && styles.passwordInputDisabled
                ]}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      !currentPasswordValidated && styles.passwordInputDisabled
                    ]}
                    placeholder={currentPasswordValidated ? "Confirma tu nueva contraseña" : "Primero valida tu contraseña actual"}
                    value={passwordData.confirmPassword}
                    onChangeText={(value) => handlePasswordInputChange('confirmPassword', value)}
                    secureTextEntry={!showPasswords.confirm}
                    editable={currentPasswordValidated && !passwordLoading}
                  />
                  <TouchableOpacity 
                    onPress={() => togglePasswordVisibility('confirm')}
                    style={styles.eyeButton}
                    disabled={!currentPasswordValidated}
                  >
                    <MaterialCommunityIcons 
                      name={showPasswords.confirm ? "eye-off" : "eye"} 
                      size={20} 
                      color={currentPasswordValidated ? "#666" : "#ccc"} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelPasswordButton} 
                onPress={handleCancelPasswordChange}
                disabled={passwordLoading}
              >
                <Text style={styles.cancelPasswordButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.savePasswordButton, passwordLoading && styles.savePasswordButtonDisabled]} 
                onPress={handleSavePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.savePasswordButtonText}>Cambiar contraseña</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

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
                  <Text style={styles.errorText}>
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
  errorText: {
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