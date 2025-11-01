// En: components/ChangePasswordModal.js -> Archivo de modal de cambio de contraseña (Frontend) 
// Este archivo es el encargado de mostrar el modal de cambio de contraseña en la aplicación.
// Permite cambiar la contraseña del usuario registrado en la base de datos.

import React, { useState, useEffect, useRef } from 'react'; // Importar los hooks de react
import {View,Text,StyleSheet,Modal,TouchableOpacity,TextInput,Alert,ActivityIndicator,ScrollView,KeyboardAvoidingView,Platform} from 'react-native'; // Importar los componentes de react-native
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Importar los componentes de expo-vector-icons
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importar AsyncStorage para persistencia
import { validateNewPassword, validateCurrentPassword } from '../src/services/profileInfo'; // Importar los servicios de perfil de cliente
import { supabase } from '../src/supabase/client'; // Importar el cliente de supabase
import { useAuth } from '../src/context/AuthContext'; // Importar el contexto de autenticación
import { useRouter } from 'expo-router'; // Importar el router

export default function ChangePasswordModal({ visible, onClose, onSuccess }) { // Exportar la función ChangePasswordModal
  const { signOut } = useAuth(); // Obtener signOut del contexto
  const router = useRouter(); // Obtener el router
  
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Establecer el estado de la contraseña
  const [currentPasswordValidated, setCurrentPasswordValidated] = useState(false); // Establecer el estado de la validación de la contraseña actual
  const [passwordLoading, setPasswordLoading] = useState(false); // Establecer el estado de carga
  const [showPasswords, setShowPasswords] = useState({ // Establecer el estado de la visualización de las contraseñas
    current: false,
    new: false,
    confirm: false
  }); 
  const [passwordValidationErrors, setPasswordValidationErrors] = useState([]); // Establecer el estado de los errores de validación de la contraseña
  
  // Estados para validaciones de seguridad
  const [currentPasswordAttempts, setCurrentPasswordAttempts] = useState(0);
  const [passwordBlocked, setPasswordBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [totalFailedAttempts, setTotalFailedAttempts] = useState(0);
  
  // Refs para evitar race conditions
  const totalFailedAttemptsRef = useRef(0);
  const currentPasswordAttemptsRef = useRef(0);
  
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

  // Cargar intentos y resetear estados locales cuando el modal se abre
  useEffect(() => {
    if (visible) {
      loadFailedAttempts();
      // Resetear intentos locales al abrir modal
      setCurrentPasswordAttempts(0);
      currentPasswordAttemptsRef.current = 0;
      setPasswordValidationErrors([]);
      setCurrentPasswordValidated(false);
    }
  }, [visible]);

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

  const handleVerifyCurrentPassword = async () => { // Función para verificar la contraseña actual
    if (passwordBlocked) { // Si está bloqueado
      Alert.alert('Acceso bloqueado', `Has excedido el número de intentos. Inténtalo de nuevo en ${Math.ceil(blockTimeRemaining / 60)} minutos.`);
      return;
    }

    if (!passwordData.currentPassword.trim()) { // Si no se ha ingresado la contraseña actual
      Alert.alert('Error', 'Por favor ingresa tu contraseña actual'); // Mostrar alerta de error
      return; // Retornar la función
    }

    if (passwordData.currentPassword.length < 8) { // Si tiene menos de 8 caracteres
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setPasswordLoading(true); // Establecer el estado de carga
    try { // Intentar verificar la contraseña actual
      console.log('Verificando contraseña actual...'); // Imprimir en la consola que se está verificando la contraseña actual
      console.log('Intentos actuales:', currentPasswordAttemptsRef.current); // Debug
      console.log('Intentos totales:', totalFailedAttemptsRef.current); // Debug
      
      const { data, error } = await validateCurrentPassword(passwordData.currentPassword); // Llamar a la función para verificar la contraseña actual
      console.log('Resultado validación - data:', data, 'error:', error); // Debug
      
      if (error) { // Si hay un error
        console.log('Error en validación, proceso intentos fallidos'); // Debug
        setCurrentPasswordValidated(false);
        
        // Usar refs para evitar race conditions
        currentPasswordAttemptsRef.current = currentPasswordAttemptsRef.current + 1;
        totalFailedAttemptsRef.current = totalFailedAttemptsRef.current + 1;
        
        const newAttempts = currentPasswordAttemptsRef.current;
        const newTotalAttempts = totalFailedAttemptsRef.current;
        
        console.log('Nuevos intentos:', newAttempts, 'Nuevos totales:', newTotalAttempts); // Debug
        
        // Actualizar estados UI
        setCurrentPasswordAttempts(newAttempts);
        await saveFailedAttempts(newTotalAttempts);
        
        if (newAttempts >= 3) {
          console.log('BLOQUEANDO por 3 intentos fallidos'); // Debug
          setPasswordBlocked(true);
          setBlockTimeRemaining(300); // 5 minutos
          currentPasswordAttemptsRef.current = 0;
          setCurrentPasswordAttempts(0);
          
          if (newTotalAttempts >= 6) {
            Alert.alert(
              'Sesión será cerrada por seguridad',
              'Has excedido 6 intentos fallidos. Tu sesión será cerrada por seguridad.',
              [
                {
                  text: 'Entendido',
                  onPress: async () => {
                    await clearFailedAttempts();
                    await signOut();
                    router.replace('/(auth)');
                  }
                }
              ]
            );
          } else {
            setTimeout(() => {
              handleClose();
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
        
        setPasswordLoading(false);
        return;
      }
      
      if (data) { // Si la contraseña actual es válida
        console.log('Contraseña CORRECTA, reseteando intentos'); // Debug
        console.log('Contraseña validada correctamente, desbloqueando campos...'); // Imprimir en la consola que la contraseña actual es válida
        
        // Limpiar también los campos de contraseña nueva para empezar fresco
        setPasswordData(prev => ({
          ...prev,
          newPassword: '',
          confirmPassword: ''
        }));
        
        setCurrentPasswordValidated(true); // Establecer el estado de la validación de la contraseña actual
        setPasswordValidationErrors([]); // Establecer el estado de los errores de validación de la contraseña
        setCurrentPasswordAttempts(0); // Resetear intentos
        currentPasswordAttemptsRef.current = 0; // Resetear ref
        
        // NO mostrar alert, solo desbloquear campos silenciosamente
        // Alert.alert('Éxito', 'Contraseña actual verificada correctamente');
      } else { // Si la contraseña actual no es válida
        setCurrentPasswordValidated(false);
        
        // Usar refs para evitar race conditions
        currentPasswordAttemptsRef.current = currentPasswordAttemptsRef.current + 1;
        totalFailedAttemptsRef.current = totalFailedAttemptsRef.current + 1;
        
        const newAttempts = currentPasswordAttemptsRef.current;
        const newTotalAttempts = totalFailedAttemptsRef.current;
        
        // Actualizar estados UI
        setCurrentPasswordAttempts(newAttempts);
        await saveFailedAttempts(newTotalAttempts);
        
        if (newAttempts >= 3) {
          setPasswordBlocked(true);
          setBlockTimeRemaining(300); // 5 minutos
          currentPasswordAttemptsRef.current = 0;
          setCurrentPasswordAttempts(0);
          
          if (newTotalAttempts >= 6) {
            Alert.alert(
              'Sesión será cerrada por seguridad',
              'Has excedido 6 intentos fallidos. Tu sesión será cerrada por seguridad.',
              [
                {
                  text: 'Entendido',
                  onPress: async () => {
                    await clearFailedAttempts();
                    await signOut();
                    router.replace('/(auth)');
                  }
                }
              ]
            );
          } else {
            setTimeout(() => {
              handleClose();
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
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordInputChange = (field, value) => { // Función para cambiar el valor de la contraseña
    setPasswordData(prev => ({ ...prev, [field]: value })); // Establecer el estado de la contraseña
    
    // Si es la nueva contraseña, validar en tiempo real solo si ya se validó la actual
    if (field === 'newPassword' && currentPasswordValidated) { // Si es la nueva contraseña y ya se validó la actual
      const validation = validateNewPassword(value, passwordData.currentPassword); // Validar la nueva contraseña
      setPasswordValidationErrors(validation.errors); // Establecer el estado de los errores de validación de la contraseña
    }
  };

  const handleSavePassword = async () => { // Función para guardar la nueva contraseña
    // Validaciones básicas
    if (!currentPasswordValidated) { // Si no se ha validado la contraseña actual
      Alert.alert('Error', 'Debes validar tu contraseña actual primero'); // Mostrar alerta de error
      return; // Retornar la función
    }
    if (!passwordData.newPassword.trim()) { // Si no se ha ingresado la nueva contraseña
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

    setPasswordLoading(true); // Establecer el estado de carga
    try {
      // Actualizar contraseña usando Supabase Auth
      const { error } = await supabase.auth.updateUser({ // Actualizar la contraseña usando Supabase Auth
        password: passwordData.newPassword // Establecer la nueva contraseña
      });

      if (error) { // Si hay un error
        Alert.alert('Error', error.message); // Mostrar alerta de error
        setPasswordLoading(false); // Establecer el estado de carga
        return; // Retornar la función
      }

      Alert.alert(
        'Éxito', 
        'Contraseña cambiada correctamente. Serás redirigido al login.',
        [
          {
            text: 'OK',
            onPress: () => {
              handleClose();
              if (onSuccess) onSuccess();
            }
          }
        ]
      ); 
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleClose = () => { // Función para cerrar el modal
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Establecer el estado de la contraseña
    setCurrentPasswordValidated(false); // Establecer el estado de la validación de la contraseña actual
    setPasswordValidationErrors([]); // Establecer el estado de los errores de validación de la contraseña
    setShowPasswords({ current: false, new: false, confirm: false }); // Establecer el estado de la visualización de las contraseñas
    setCurrentPasswordAttempts(0); // Resetear intentos locales
    currentPasswordAttemptsRef.current = 0; // Resetear ref
    // NO resetear totalFailedAttempts para mantener el conteo persistente
    onClose(); // Llamar a la función onClose
  };

  const togglePasswordVisibility = (field) => { // Función para cambiar la visualización de las contraseñas
    setShowPasswords(prev => ({ // Establecer el estado de la visualización de las contraseñas
      ...prev, // Establecer el estado de la visualización de las contraseñas
      [field]: !prev[field] // Establecer el estado de la visualización de las contraseñas
    })); // Establecer el estado de la visualización de las contraseñas
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ width: '100%', alignItems: 'center' }}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
              <TouchableOpacity onPress={handleClose}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {/* Indicador de bloqueo */}
            {passwordBlocked && (
              <View style={styles.blockedContainer}>
                <MaterialCommunityIcons name="lock" size={24} color="#dc3545" />
                <Text style={styles.blockedText}>
                  Acceso bloqueado. Intenta de nuevo en {Math.ceil(blockTimeRemaining / 60)} minutos
                </Text>
              </View>
            )}
            
            <ScrollView 
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
            {/* Contraseña actual */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Contraseña Actual
                {currentPasswordValidated && (
                  <Text style={styles.validationSuccess}> ✓</Text>
                )}
              </Text>
              <View style={[
                styles.passwordInputWrapper,
                currentPasswordValidated && styles.passwordInputValid
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
              
              {!currentPasswordValidated && (
                <TouchableOpacity 
                  style={[
                    styles.verifyButton, 
                    (passwordLoading || passwordBlocked || !passwordData.currentPassword.trim()) && styles.verifyButtonDisabled
                  ]}
                  onPress={handleVerifyCurrentPassword}
                  disabled={passwordLoading || !passwordData.currentPassword.trim() || passwordBlocked}
                >
                  {passwordLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : passwordBlocked ? (
                    <>
                      <MaterialCommunityIcons name="lock" size={20} color="#999" />
                      <Text style={[styles.verifyButtonText, { color: '#999' }]}>Bloqueado</Text>
                    </>
                  ) : (
                    <>
                      <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                      <Text style={styles.verifyButtonText}>Verificar contraseña</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              
              {currentPasswordAttempts > 0 && !currentPasswordValidated && (
                <Text style={styles.attemptsWarning}>
                  Intentos fallidos: {currentPasswordAttempts}/3
                </Text>
              )}
              
              {totalFailedAttempts >= 3 && totalFailedAttempts < 6 && (
                <Text style={styles.attemptsWarning}>
                  ⚠️ Intentos totales: {totalFailedAttempts}/6
                </Text>
              )}
            </View>

            {/* Nueva contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Nueva Contraseña
                {!currentPasswordValidated && (
                  <Text style={styles.validationWarning}> (Bloqueado)</Text>
                )}
              </Text>
              <View style={[
                styles.passwordInputWrapper,
                !currentPasswordValidated && styles.passwordInputDisabled
              ]}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    !currentPasswordValidated && styles.passwordInputDisabledText
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
                >
                  <MaterialCommunityIcons 
                    name={showPasswords.new ? "eye-off" : "eye"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
              
              {passwordValidationErrors.length > 0 && currentPasswordValidated && (
                <View style={styles.errorContainer}>
                  {passwordValidationErrors.map((error, index) => (
                    <Text key={index} style={styles.errorText}>
                      • {error}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* Confirmar contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Confirmar Contraseña
                {!currentPasswordValidated && (
                  <Text style={styles.validationWarning}> (Bloqueado)</Text>
                )}
              </Text>
              <View style={[
                styles.passwordInputWrapper,
                !currentPasswordValidated && styles.passwordInputDisabled
              ]}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    !currentPasswordValidated && styles.passwordInputDisabledText
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
                >
                  <MaterialCommunityIcons 
                    name={showPasswords.confirm ? "eye-off" : "eye"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>
            </ScrollView>

            <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.saveButton, (!currentPasswordValidated || passwordLoading) && styles.saveButtonDisabled]}
              onPress={handleSavePassword}
              disabled={!currentPasswordValidated || passwordLoading}
            >
              {passwordLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Cambiar Contraseña</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  passwordInputDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.5,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  passwordInputDisabledText: {
    color: '#999',
  },
  passwordInputValid: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8f4',
  },
  eyeButton: {
    padding: 12,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  verifyButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  verifyButtonBlocked: {
    backgroundColor: '#e0e0e0',
    opacity: 0.7,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#c62828',
    marginVertical: 2,
  },
  validationSuccess: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  validationWarning: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: 'normal',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#177eaaff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
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
  blockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#f8d7da',
    borderBottomWidth: 1,
    borderBottomColor: '#f5c6cb',
  },
  blockedText: {
    marginLeft: 10,
    color: '#721c24',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

