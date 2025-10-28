// Componente modal para eliminar perfil del cliente Google (sin contraseña)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DeleteGoogleProfileModal({
  visible,
  onClose,
  onConfirmDelete,
  deleteGoogleLoading
}) {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Eliminar Perfil (Google)</Text>
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
          
          <Text style={styles.googleWarning}>
            🔐 Como usuario de Google, no necesitas validar contraseña.
          </Text>
        </View>
        
        <View style={styles.modalActions}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onClose}
            disabled={deleteGoogleLoading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.deleteConfirmButton, deleteGoogleLoading && styles.deleteConfirmButtonDisabled]}
            onPress={onConfirmDelete}
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
    backgroundColor: '#4285f4',
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

