// Componente modal para eliminar perfil del cliente (requiere contraseña)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DeleteProfileModal({
  visible,
  onClose,
  passwordData,
  onPasswordChange,
  onVerifyPassword,
  onConfirmDelete,
  deletePasswordValidated,
  deletePasswordAttempts,
  deletePasswordLoading,
  showDeletePassword,
  onTogglePasswordVisibility
}) {
  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.modalOverlay}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Eliminar Perfil</Text>
            <TouchableOpacity 
              onPress={onClose}
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
                  value={passwordData}
                  onChangeText={onPasswordChange}
                  secureTextEntry={!showDeletePassword}
                  editable={!deletePasswordLoading && !deletePasswordValidated}
                />
                <TouchableOpacity 
                  onPress={onTogglePasswordVisibility}
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
                  onPress={onVerifyPassword}
                  disabled={deletePasswordLoading || !passwordData.trim()}
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
              onPress={onClose}
              disabled={deletePasswordLoading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.deleteConfirmButton, !deletePasswordValidated && styles.deleteConfirmButtonDisabled]}
              onPress={onConfirmDelete}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
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
  closeButton: {
    padding: 4,
  },
  deleteForm: {
    padding: 10,
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
  passwordInputContainer: {
    marginBottom: 15,
    marginTop: 10,
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
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  validationSuccess: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  passwordInputValid: {
    borderColor: '#28a745',
    borderWidth: 2,
  },
  passwordInputError: {
    borderColor: '#dc3545',
    borderWidth: 2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#db4437',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#db4437',
    fontSize: 16,
    fontWeight: 'bold',
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
});
