// En: components/ChangePasswordModal.js -> Archivo de modal de cambio de contraseña (Frontend) 
// Este archivo es el encargado de mostrar el modal de cambio de contraseña en la aplicación.
// Permite cambiar la contraseña del usuario registrado en la base de datos.

import React, { useState } from 'react'; // Importar los hooks de react
import {View,Text,StyleSheet,Modal,TouchableOpacity,TextInput,Alert,ActivityIndicator} from 'react-native'; // Importar los componentes de react-native
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Importar los componentes de expo-vector-icons
import { validateNewPassword, validateCurrentPassword } from '../src/services/profileInfo'; // Importar los servicios de perfil de cliente
import { supabase } from '../src/supabase/client'; // Importar el cliente de supabase

export default function ChangePasswordModal({ visible, onClose, onSuccess }) { // Exportar la función ChangePasswordModal
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Establecer el estado de la contraseña
  const [currentPasswordValidated, setCurrentPasswordValidated] = useState(false); // Establecer el estado de la validación de la contraseña actual
  const [passwordLoading, setPasswordLoading] = useState(false); // Establecer el estado de carga
  const [showPasswords, setShowPasswords] = useState({ // Establecer el estado de la visualización de las contraseñas
    current: false,
    new: false,
    confirm: false
  }); 
  const [passwordValidationErrors, setPasswordValidationErrors] = useState([]); // Establecer el estado de los errores de validación de la contraseña

  const handleVerifyCurrentPassword = async () => { // Función para verificar la contraseña actual
    if (!passwordData.currentPassword.trim()) { // Si no se ha ingresado la contraseña actual
      Alert.alert('Error', 'Por favor ingresa tu contraseña actual'); // Mostrar alerta de error
      return; // Retornar la función
    }

    setPasswordLoading(true); // Establecer el estado de carga
    try { // Intentar verificar la contraseña actual
      console.log('Verificando contraseña actual...'); // Imprimir en la consola que se está verificando la contraseña actual
      const { data, error } = await validateCurrentPassword(passwordData.currentPassword); // Llamar a la función para verificar la contraseña actual
      
      if (error) { // Si hay un error
        Alert.alert('Error', error);
        setPasswordLoading(false); // Establecer el estado de carga
        return; // Retornar la función
      }
      
      if (data) { // Si la contraseña actual es válida
        console.log('Contraseña validada correctamente, desbloqueando campos...'); // Imprimir en la consola que la contraseña actual es válida
        setCurrentPasswordValidated(true); // Establecer el estado de la validación de la contraseña actual
        setPasswordValidationErrors([]); // Establecer el estado de los errores de validación de la contraseña
        Alert.alert('Éxito', 'Contraseña actual verificada correctamente');
      } else {
        Alert.alert('Error', 'Contraseña actual incorrecta');
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
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
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
                  style={[styles.verifyButton, passwordLoading && styles.verifyButtonDisabled]}
                  onPress={handleVerifyCurrentPassword}
                  disabled={passwordLoading || !passwordData.currentPassword.trim()}
                >
                  {passwordLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                      <Text style={styles.verifyButtonText}>Verificar contraseña</Text>
                    </>
                  )}
                </TouchableOpacity>
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
          </View>

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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
    opacity: 0.6,
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
});

