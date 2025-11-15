import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/supabase/client';

/**
 * EventsModal
 * Props:
 * - visible: boolean
 * - onClose: function
 * - event: objeto con la información del evento (id, nombre, descripcion, fecha, ubicacion, imagen_url, etc.)
 */
const EventsModal = ({ visible = false, onClose = () => {}, event = null, onDataChange = () => {} }) => {
  const { session, role } = useAuth(); // Obtenemos el rol del usuario
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Cuando el modal se hace visible y hay un evento, verificamos si ya está guardado.
    if (visible && event?.id && session?.user?.id) {
      checkIfEventIsSaved();
    }
  }, [visible, event, session]);

  const checkIfEventIsSaved = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('eventos_guardados')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('evento_id', event.id)
        .maybeSingle();
      if (error) throw error;
      setIsSaved(data !== null);
    } catch (error) {
      // No mostramos alerta para no ser intrusivos
    } finally {
      setIsLoading(false);
    }
  };

  if (!event) return null;

  const title = event.nombre || event.titulo || event.title || 'Evento';
  const description = event.descripcion || event.description || '';
  const date = event.fecha || event.date || '';
  const location = event.ubicacion || event.location || '';
  const imageUrl = event.imagen_url || event.image_url || event.image || null;

  const formatDate = (d) => {
    if (!d) return '';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      return dt.toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return d;
    }
  };

  const handleToggleSaveEvent = async () => {
    if (!session?.user?.id) {
      Alert.alert("Acción requerida", "Debes iniciar sesión para guardar un evento.");
      return;
    }

    setIsLoading(true);
    try {
      if (isSaved) {
        // Si ya está guardado, lo eliminamos
        const { error } = await supabase
          .from('eventos_guardados')
          .delete()
          .eq('user_id', session.user.id)
          .eq('evento_id', event.id);
        if (error) throw error;
        setIsSaved(false);
        onDataChange(); // Notificar que los datos cambiaron
        // Alert.alert("Evento Eliminado", "El evento ha sido eliminado de tu lista.");
      } else {
        // Si no está guardado, lo insertamos
        const { error } = await supabase
          .from('eventos_guardados')
          .insert({
            user_id: session.user.id,
            evento_id: event.id,
          });
        if (error) throw error;
        setIsSaved(true);
        onDataChange(); // Notificar que los datos cambiaron
        // Alert.alert("¡Éxito!", "El evento ha sido guardado en tu perfil.");
      }
    } catch (error) {
      // Si hay un error, no cambiamos el estado visual
      Alert.alert("Error", "No se pudo completar la acción. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Determinamos el texto del botón según el rol del usuario
  const buttonTexts = {
    save: role === 'artesano' ? 'Confirmar Asistencia' : 'Guardar Evento',
    delete: role === 'artesano' ? 'Anular Asistencia' : 'Eliminar Evento',
  };

  return (
    <Modal animationType="slide" visible={visible} transparent>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} accessible accessibilityLabel="Cerrar">
            <MaterialCommunityIcons name="close" size={24} color="#333" />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.imageWrap}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <MaterialCommunityIcons name="calendar" size={48} color="#bbb" />
                </View>
              )}
            </View>

            <View style={styles.body}>
              <Text style={styles.title}>{title}</Text>

              <View style={styles.metaRow}>
                {date ? <View style={styles.chip}><Text style={styles.chipText}>📅 {formatDate(date)}</Text></View> : null}
                {location ? <View style={[styles.chip, { marginTop: 8 }]}><Text style={styles.chipText}>📍 {location}</Text></View> : null}
              </View>

              {description ? (
                <Text style={styles.description}>{description}</Text>
              ) : (
                <Text style={[styles.description, { color: '#999' }]}>No hay descripción disponible.</Text>
              )}

              <View style={styles.divider} />



              <View style={styles.buttonsRow}>
                <TouchableOpacity 
                  style={[isSaved ? styles.deleteButton : styles.primaryButton, isLoading && styles.buttonDisabled]} 
                  onPress={handleToggleSaveEvent}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={isSaved ? styles.deleteButtonText : styles.primaryButtonText}>
                      {isSaved ? buttonTexts.delete : buttonTexts.save}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                  <Text style={styles.secondaryButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 10,
    padding: 6,
  },
  content: {
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'stretch',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 12,
    marginHorizontal: 12,
  },
  metaRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: 8,
    marginHorizontal: 12,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  chip: {
    backgroundColor: '#f3f3f3',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 12,
    color: '#555',
  },
  body: {
    paddingHorizontal: 12,
    paddingBottom: 18,
  },
  imageWrap: {
    width: '100%',
    backgroundColor: '#f0f0f0',
  },
  description: {
    marginTop: 12,
    marginHorizontal: 12,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  small: {
    marginTop: 8,
    marginHorizontal: 12,
    fontSize: 12,
    color: '#888',
  },
  divider: {
    height: 1,
    backgroundColor: '#eef0f2',
    marginTop: 12,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoText: {
    marginLeft: 8,
    color: '#555',
    fontSize: 13,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  primaryButton: {
    backgroundColor: '#9D046D',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f3f3f3',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#dc3545', // Un rojo para indicar eliminación
  },
  deleteButtonText: {
    color: '#dc3545', // Texto rojo
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: '#ccc',
    borderColor: '#ccc',
  },
});

export default EventsModal;
