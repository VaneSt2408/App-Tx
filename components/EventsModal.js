import React from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * EventsModal
 * Props:
 * - visible: boolean
 * - onClose: function
 * - event: objeto con la información del evento (id, nombre, descripcion, fecha, ubicacion, imagen_url, creador_id, etc.)
 */
const EventsModal = ({ visible = false, onClose = () => {}, event = null }) => {


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
                {location ? <View style={[styles.chip, { marginLeft: 8 }]}><Text style={styles.chipText}>📍 {location}</Text></View> : null}
              </View>

              {description ? (
                <Text style={styles.description}>{description}</Text>
              ) : (
                <Text style={[styles.description, { color: '#999' }]}>No hay descripción disponible.</Text>
              )}

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="account" size={18} color="#666" />
                <Text style={styles.infoText}>{event.creador_id ? `Creado por: ${event.creador_id}` : 'Creador desconocido'}</Text>
              </View>

              {event.organizador ? (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="account-group" size={18} color="#666" />
                  <Text style={styles.infoText}>Organizador: {event.organizador}</Text>
                </View>
              ) : null}

              <View style={styles.buttonsRow}>
                <TouchableOpacity style={styles.primaryButton} onPress={() => { /* placeholder for action */ }}>
                  <Text style={styles.primaryButtonText}>Ir al evento</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
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
});

export default EventsModal;
