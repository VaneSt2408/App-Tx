// En: app/(app)/Eventos.js -> Archivo de los eventos (Frontend)
// Este archivo es el encargado de mostrar los eventos en la aplicación.
// Muestra los eventos registrados en la base de datos con un estilo similar a productos y publicaciones.

// Importaciones
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator,
  RefreshControl, Alert, Dimensions, Modal, ScrollView, PanResponder, Animated,
  TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { getEvents, createEventForCurrentUser, updateEventForCurrentUser } from '../../src/services/eventsService';
import { supabase } from '../../src/supabase/client';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window'); // Obtener el ancho de la ventana
const imageSize = (width - 40) / 3; // Para grid de 3 columnas

// Componente principal
export default function EventosPage() {
  const router = useRouter(); // Obtener el router
  const { userId } = useLocalSearchParams(); // Obtener el id del usuario (opcional)
  const { session, role } = useAuth(); // Obtener la sesión y el rol
  const [eventos, setEventos] = useState([]); // Establecer el estado de los eventos
  const [loading, setLoading] = useState(true); // Establecer el estado de carga
  const [refreshing, setRefreshing] = useState(false); // Establecer el estado de refresco
  const [selectedEvento, setSelectedEvento] = useState(null); // Establecer el estado del evento seleccionado
  const [selectedIndex, setSelectedIndex] = useState(0); // Establecer el estado del índice del evento seleccionado
  const [showEventoModal, setShowEventoModal] = useState(false); // Establecer el estado del modal de evento
  const [showCreateModal, setShowCreateModal] = useState(false); // Establecer el estado del modal de creación
  const [showEditModal, setShowEditModal] = useState(false); // Establecer el estado del modal de edición
  const [eventFormData, setEventFormData] = useState({
    nombre: '',
    descripcion: '',
    fecha: '',
    ubicacion: '',
  }); // Estado para el formulario de evento
  const [selectedImage, setSelectedImage] = useState(null); // Estado para la imagen seleccionada
  const [createLoading, setCreateLoading] = useState(false); // Estado de carga para crear evento
  const [editLoading, setEditLoading] = useState(false); // Estado de carga para editar evento
  const swipeAnim = React.useRef(new Animated.Value(0)).current; // Referencia para la animación del swipe
  
  // Verificar si el usuario es administrador (solo los admins pueden crear eventos)
  const isAdmin = role === 'admin';
  
  // Si hay userId, mostrar solo eventos de ese usuario, sino mostrar todos
  const isOwnProfile = userId && session?.user?.id === userId; // Verificar si el usuario es el propio

  // Efecto para cargar los eventos
  useEffect(() => {
    loadEventos();
  }, [userId]);

  // Función para cargar los eventos
  const loadEventos = async () => {
    try {
      setLoading(true);
      const result = await getEvents();
      
      if (result.success) {
        // Si hay userId, filtrar eventos de ese usuario
        let eventosFiltrados = result.data || [];
        if (userId) {
          eventosFiltrados = eventosFiltrados.filter(evento => evento.creador_id === userId);
        }
        
        // Debug: verificar imágenes
        console.log('Eventos cargados:', eventosFiltrados.length);
        eventosFiltrados.forEach((evento, idx) => {
          console.log(`Evento ${idx + 1}:`, {
            id: evento.id,
            nombre: evento.nombre,
            tieneImagen: !!evento.imagen_url,
            imagen_url: evento.imagen_url
          });
        });
        
        setEventos(eventosFiltrados);
      } else {
        Alert.alert('Error', result.error || 'No se pudieron cargar los eventos');
        setEventos([]);
      }
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
      setEventos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para refrescar los eventos
  const onRefresh = () => {
    setRefreshing(true);
    loadEventos();
  };

  // Función para seleccionar un evento
  const handleSelectEvento = (evento, index) => {
    setSelectedEvento(evento);
    setSelectedIndex(index);
    setShowEventoModal(true);
  };

  // Función para cerrar el modal de evento
  const handleCloseModal = () => {
    setShowEventoModal(false);
    setSelectedEvento(null);
    setSelectedIndex(0);
    swipeAnim.setValue(0);
  };

  // Función para navegar al siguiente evento
  const handleNextEvento = () => {
    if (selectedIndex < eventos.length - 1) {
      const nextIndex = selectedIndex + 1;
      setSelectedIndex(nextIndex);
      setSelectedEvento(eventos[nextIndex]);
      swipeAnim.setValue(0);
    }
  };

  // Función para navegar al evento anterior
  const handlePreviousEvento = () => {
    if (selectedIndex > 0) {
      const prevIndex = selectedIndex - 1;
      setSelectedIndex(prevIndex);
      setSelectedEvento(eventos[prevIndex]);
      swipeAnim.setValue(0);
    }
  };

  // PanResponder para gestos de deslizamiento
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, vx } = gestureState;
        // Deslizar hacia la izquierda (siguiente)
        if (dx < -50 || vx < -0.5) {
          handleNextEvento();
        }
        // Deslizar hacia la derecha (anterior)
        else if (dx > 50 || vx > 0.5) {
          handlePreviousEvento();
        } else {
          // Resetear animación si no se alcanzó el umbral
          Animated.spring(swipeAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        swipeAnim.setValue(gestureState.dx);
      },
    })
  ).current;

  // Función para editar un evento
  const handleEditEvento = () => {
    if (selectedEvento) {
      // Convertir fecha ISO a formato editable (YYYY-MM-DDTHH:mm)
      const fechaDate = new Date(selectedEvento.fecha);
      const fechaFormatted = fechaDate.toISOString().slice(0, 16); // Formato: YYYY-MM-DDTHH:mm
      
      setEventFormData({
        nombre: selectedEvento.nombre || '',
        descripcion: selectedEvento.descripcion || '',
        fecha: fechaFormatted,
        ubicacion: selectedEvento.ubicacion || '',
      });
      setSelectedImage(null); // No mostrar imagen actual en el selector
      setShowEventoModal(false); // Cerrar modal de detalles
      setShowEditModal(true); // Abrir modal de edición
    }
  };

  // Función para guardar la edición del evento
  const handleSaveEdit = async () => {
    if (!selectedEvento) return;

    // Validaciones
    if (!eventFormData.nombre.trim()) {
      Alert.alert('Error', 'El nombre del evento es requerido');
      return;
    }
    if (!eventFormData.descripcion.trim()) {
      Alert.alert('Error', 'La descripción del evento es requerida');
      return;
    }
    if (!eventFormData.fecha.trim()) {
      Alert.alert('Error', 'La fecha del evento es requerida');
      return;
    }

    // Validar formato de fecha
    const fechaDate = new Date(eventFormData.fecha);
    if (isNaN(fechaDate.getTime())) {
      Alert.alert('Error', 'La fecha ingresada no es válida');
      return;
    }

    setEditLoading(true);
    try {
      // Preparar el imageAsset si hay nueva imagen seleccionada
      const imageAsset = selectedImage ? {
        base64: selectedImage.base64,
        mimeType: selectedImage.mimeType || selectedImage.type || 'image/jpeg',
        uri: selectedImage.uri
      } : null;

      // Convertir fecha a ISO string
      const fechaISO = fechaDate.toISOString();

      const result = await updateEventForCurrentUser(
        selectedEvento.id,
        eventFormData.nombre.trim(),
        eventFormData.descripcion.trim(),
        fechaISO,
        eventFormData.ubicacion.trim() || null,
        imageAsset
      );

      if (result.success) {
        Alert.alert('Éxito', 'Evento actualizado correctamente');
        handleCloseEditModal();
        loadEventos(); // Recargar los eventos
      } else {
        Alert.alert('Error', result.error || 'No se pudo actualizar el evento');
      }
    } catch (error) {
      console.error('Error al actualizar evento:', error);
      Alert.alert('Error', error.message || 'Ocurrió un error al actualizar el evento');
    } finally {
      setEditLoading(false);
    }
  };

  // Función para cerrar el modal de edición
  const handleCloseEditModal = () => {
    if (!editLoading) {
      setShowEditModal(false);
      setEventFormData({
        nombre: '',
        descripcion: '',
        fecha: '',
      });
      setSelectedImage(null);
    }
  };

  // Función para eliminar un evento
  const handleDeleteEvento = async (eventoId) => {
    Alert.alert(
      'Eliminar Evento',
      '¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('eventos')
                .delete()
                .eq('id', eventoId);

              if (error) {
                Alert.alert('Error', error.message || 'No se pudo eliminar el evento');
              } else {
                Alert.alert('Éxito', 'Evento eliminado correctamente');
                handleCloseModal();
                loadEventos();
              }
            } catch (error) {
              Alert.alert('Error', 'Ocurrió un error al eliminar el evento');
            }
          }
        }
      ]
    );
  };

  // Función para formatear la fecha de un evento
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para seleccionar imagen del evento
  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Se necesita acceso a la galería para seleccionar una imagen.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Función para manejar cambios en el formulario
  const handleFormChange = (field, value) => {
    setEventFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para crear el evento
  const handleCreateEvent = async () => {
    // Validaciones
    if (!eventFormData.nombre.trim()) {
      Alert.alert('Error', 'El nombre del evento es requerido');
      return;
    }
    if (!eventFormData.descripcion.trim()) {
      Alert.alert('Error', 'La descripción del evento es requerida');
      return;
    }
    if (!eventFormData.fecha.trim()) {
      Alert.alert('Error', 'La fecha del evento es requerida');
      return;
    }

    // Validar formato de fecha (ISO string)
    const fechaDate = new Date(eventFormData.fecha);
    if (isNaN(fechaDate.getTime())) {
      Alert.alert('Error', 'La fecha ingresada no es válida');
      return;
    }

    setCreateLoading(true);
    try {
      // Preparar el imageAsset si hay imagen seleccionada
      const imageAsset = selectedImage ? {
        base64: selectedImage.base64,
        mimeType: selectedImage.mimeType || selectedImage.type || 'image/jpeg',
        uri: selectedImage.uri
      } : null;

      // Convertir fecha a ISO string
      const fechaISO = fechaDate.toISOString();

      const result = await createEventForCurrentUser(
        eventFormData.nombre.trim(),
        eventFormData.descripcion.trim(),
        fechaISO,
        eventFormData.ubicacion.trim() || null,
        imageAsset
      );

      if (result.success) {
        Alert.alert('Éxito', 'Evento creado correctamente');
        handleCloseCreateModal();
        loadEventos(); // Recargar los eventos
      } else {
        Alert.alert('Error', result.error || 'No se pudo crear el evento');
      }
    } catch (error) {
      console.error('Error al crear evento:', error);
      Alert.alert('Error', error.message || 'Ocurrió un error al crear el evento');
    } finally {
      setCreateLoading(false);
    }
  };

  // Función para cerrar el modal de creación y limpiar el formulario
  const handleCloseCreateModal = () => {
    if (!createLoading) {
      setShowCreateModal(false);
      setEventFormData({
        nombre: '',
        descripcion: '',
        fecha: '',
        ubicacion: '',
      });
      setSelectedImage(null);
    }
  };

  // Función para renderizar un evento
  const renderEvento = ({ item, index }) => {
    // Verificar si hay imagen_url válida
    const hasImage = item.imagen_url && item.imagen_url.trim() !== '';
    
    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => handleSelectEvento(item, index)}
        activeOpacity={0.7}
      >
        {hasImage ? (
          <Image 
            source={{ uri: item.imagen_url }} 
            style={styles.gridImage}
            resizeMode="cover"
            onError={(error) => {
              console.log('Error al cargar imagen del evento:', error.nativeEvent.error);
              console.log('URL de la imagen que falló:', item.imagen_url);
            }}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialCommunityIcons name="calendar-star" size={30} color="#ccc" />
            {item.nombre && (
              <Text style={styles.placeholderText} numberOfLines={2}>
                {item.nombre}
              </Text>
            )}
          </View>
        )}
        
        {/* Overlay con fecha */}
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <MaterialCommunityIcons name="calendar" size={14} color="#fff" />
            <Text style={styles.overlayText} numberOfLines={1}>
              {formatDate(item.fecha)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Función para renderizar el contenido vacío
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="calendar-remove-outline" size={80} color="#ccc" />
      <Text style={styles.emptyText}>
        {isOwnProfile ? 'No tienes eventos aún' : userId ? 'No hay eventos' : 'No hay eventos disponibles'}
      </Text>
      <Text style={styles.emptySubtext}>
        {isOwnProfile
          ? 'Crea tu primer evento para compartir con la comunidad'
          : userId
          ? 'Este usuario aún no ha creado eventos'
          : 'Aún no se han creado eventos en la plataforma'
        }
      </Text>
      {isAdmin && !userId && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Crear Evento</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && eventos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9D046D" />
        <Text style={styles.loadingText}>Cargando eventos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {isOwnProfile ? 'Mis Eventos' : userId ? 'Eventos' : 'Todos los Eventos'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {eventos.length} {eventos.length === 1 ? 'evento' : 'eventos'}
          </Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#9D046D" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={eventos}
        renderItem={renderEvento}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={eventos.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#9D046D']}
            tintColor="#9D046D"
          />
        }
      />

      {/* Modal de detalles de evento */}
      <Modal
        visible={showEventoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent} {...panResponder.panHandlers}>
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                {selectedIndex > 0 && (
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={handlePreviousEvento}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={24} color="#333" />
                  </TouchableOpacity>
                )}
                <Text style={styles.modalTitle}>
                  Evento {selectedIndex + 1} de {eventos.length}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCloseModal}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Animated.View
              style={[
                styles.modalBody,
                {
                  transform: [{ translateX: swipeAnim }],
                  opacity: swipeAnim.interpolate({
                    inputRange: [-200, 0, 200],
                    outputRange: [0.5, 1, 0.5],
                  }),
                },
              ]}
            >
              <ScrollView>
                {selectedEvento && (
                  <>
                    {/* Imagen */}
                    {selectedEvento.imagen_url && selectedEvento.imagen_url.trim() !== '' ? (
                      <Image
                        source={{ uri: selectedEvento.imagen_url }}
                        style={styles.modalImage}
                        resizeMode="cover"
                        onError={(error) => {
                          console.log('Error al cargar imagen en modal:', error.nativeEvent.error);
                        }}
                      />
                    ) : (
                      <View style={styles.modalImagePlaceholder}>
                        <MaterialCommunityIcons name="calendar-star" size={60} color="#ccc" />
                      </View>
                    )}

                    {/* Información */}
                    <View style={styles.modalInfo}>
                      {selectedEvento.nombre && (
                        <View style={styles.infoRow}>
                          <MaterialCommunityIcons name="calendar-text" size={20} color="#9D046D" />
                          <Text style={styles.infoLabel}>Nombre:</Text>
                          <Text style={styles.infoValue}>{selectedEvento.nombre}</Text>
                        </View>
                      )}

                      <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="calendar-clock" size={20} color="#2196f3" />
                        <Text style={styles.infoLabel}>Fecha:</Text>
                        <Text style={styles.infoValue}>{formatDate(selectedEvento.fecha)}</Text>
                      </View>

                      {selectedEvento.ubicacion && (
                        <View style={styles.infoRow}>
                          <MaterialCommunityIcons name="map-marker" size={20} color="#ff9800" />
                          <Text style={styles.infoLabel}>Ubicación:</Text>
                          <Text style={styles.infoValue}>{selectedEvento.ubicacion}</Text>
                        </View>
                      )}

                      {/* Descripción */}
                      {selectedEvento.descripcion && (
                        <View style={styles.textSection}>
                          <Text style={styles.textLabel}>Descripción:</Text>
                          <Text style={styles.textContent}>{selectedEvento.descripcion}</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </ScrollView>
            </Animated.View>

            {/* Botones de navegación */}
            <View style={styles.modalNavigation}>
              <TouchableOpacity
                style={[styles.navButton, selectedIndex === 0 && styles.navButtonDisabled]}
                onPress={handlePreviousEvento}
                disabled={selectedIndex === 0}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={24}
                  color={selectedIndex === 0 ? '#9D046D' : 'rgba(238, 3, 89, 0.35)'}
                />
                <Text style={[styles.navButtonText, selectedIndex === 0 && styles.navButtonTextDisabled]}>
                  Anterior
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, selectedIndex === eventos.length - 1 && styles.navButtonDisabled]}
                onPress={handleNextEvento}
                disabled={selectedIndex === eventos.length - 1}
              >
                <Text style={[styles.navButtonText, selectedIndex === eventos.length - 1 && styles.navButtonTextDisabled]}>
                  Siguiente
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={selectedIndex === eventos.length - 1 ? 'rgba(238, 3, 89, 0.35)' : '#9D046D'}
                />
              </TouchableOpacity>
            </View>

            {/* Botones de acción */}
            {isAdmin && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditEvento}
                >
                  <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteEvento(selectedEvento?.id)}
                >
                  <MaterialCommunityIcons name="delete" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de creación de evento */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseCreateModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.createModalContainer}>
            <View style={styles.createModalContent}>
              <View style={styles.createModalHeader}>
                <Text style={styles.createModalTitle}>Crear Nuevo Evento</Text>
                <TouchableOpacity
                  onPress={handleCloseCreateModal}
                  disabled={createLoading}
                >
                  <MaterialCommunityIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.createModalBody} showsVerticalScrollIndicator={false}>
                {/* Campo de nombre */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Nombre del Evento *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ej: Festival de Artesanías 2024"
                    placeholderTextColor="#999"
                    value={eventFormData.nombre}
                    onChangeText={(text) => handleFormChange('nombre', text)}
                    maxLength={100}
                    editable={!createLoading}
                  />
                </View>

                {/* Campo de descripción */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Descripción *</Text>
                  <TextInput
                    style={styles.formTextArea}
                    placeholder="Describe el evento..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    value={eventFormData.descripcion}
                    onChangeText={(text) => handleFormChange('descripcion', text)}
                    maxLength={500}
                    textAlignVertical="top"
                    editable={!createLoading}
                  />
                  <Text style={styles.characterCount}>
                    {eventFormData.descripcion.length}/500 caracteres
                  </Text>
                </View>

                {/* Campo de fecha */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Fecha y Hora del Evento *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DDTHH:mm (ej: 2024-12-31T18:00)"
                    placeholderTextColor="#999"
                    value={eventFormData.fecha}
                    onChangeText={(text) => handleFormChange('fecha', text)}
                    editable={!createLoading}
                  />
                  <Text style={styles.formHint}>
                    Formato: Año-Mes-DíaTHora:Minuto (ej: 2024-12-31T18:00)
                  </Text>
                </View>

                {/* Campo de ubicación */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Ubicación del Evento (Opcional)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ej: Plaza Principal, Ciudad, Estado"
                    placeholderTextColor="#999"
                    value={eventFormData.ubicacion}
                    onChangeText={(text) => handleFormChange('ubicacion', text)}
                    maxLength={200}
                    editable={!createLoading}
                  />
                </View>

                {/* Sección de imagen */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Imagen del Evento (Opcional)</Text>
                  <TouchableOpacity
                    style={styles.imagePickerButton}
                    onPress={handleSelectImage}
                    disabled={createLoading}
                  >
                    <MaterialCommunityIcons name="image-plus" size={24} color="#9D046D" />
                    <Text style={styles.imagePickerText}>
                      {selectedImage ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
                    </Text>
                  </TouchableOpacity>

                  {/* Previsualización de imagen */}
                  {selectedImage && (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: selectedImage.uri }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setSelectedImage(null)}
                        disabled={createLoading}
                      >
                        <MaterialCommunityIcons name="close-circle" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </ScrollView>

              {/* Botones de acción */}
              <View style={styles.createModalActions}>
                <TouchableOpacity
                  style={[styles.cancelCreateButton, createLoading && styles.disabledButton]}
                  onPress={handleCloseCreateModal}
                  disabled={createLoading}
                >
                  <Text style={styles.cancelCreateButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.createSubmitButton, createLoading && styles.disabledButton]}
                  onPress={handleCreateEvent}
                  disabled={createLoading}
                >
                  {createLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="check" size={20} color="#fff" />
                      <Text style={styles.createSubmitButtonText}>Crear Evento</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de edición de evento */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseEditModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.createModalContainer}>
            <View style={styles.createModalContent}>
              <View style={styles.createModalHeader}>
                <Text style={styles.createModalTitle}>Editar Evento</Text>
                <TouchableOpacity
                  onPress={handleCloseEditModal}
                  disabled={editLoading}
                >
                  <MaterialCommunityIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.createModalBody} showsVerticalScrollIndicator={false}>
                {/* Campo de nombre */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Nombre del Evento *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ej: Festival de Artesanías 2024"
                    placeholderTextColor="#999"
                    value={eventFormData.nombre}
                    onChangeText={(text) => handleFormChange('nombre', text)}
                    maxLength={100}
                    editable={!editLoading}
                  />
                </View>

                {/* Campo de descripción */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Descripción *</Text>
                  <TextInput
                    style={styles.formTextArea}
                    placeholder="Describe el evento..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    value={eventFormData.descripcion}
                    onChangeText={(text) => handleFormChange('descripcion', text)}
                    maxLength={500}
                    textAlignVertical="top"
                    editable={!editLoading}
                  />
                  <Text style={styles.characterCount}>
                    {eventFormData.descripcion.length}/500 caracteres
                  </Text>
                </View>

                {/* Campo de fecha */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Fecha y Hora del Evento *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DDTHH:mm (ej: 2024-12-31T18:00)"
                    placeholderTextColor="#999"
                    value={eventFormData.fecha}
                    onChangeText={(text) => handleFormChange('fecha', text)}
                    editable={!editLoading}
                  />
                  <Text style={styles.formHint}>
                    Formato: Año-Mes-DíaTHora:Minuto (ej: 2024-12-31T18:00)
                  </Text>
                </View>

                {/* Campo de ubicación */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Ubicación del Evento (Opcional)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ej: Plaza Principal, Ciudad, Estado"
                    placeholderTextColor="#999"
                    value={eventFormData.ubicacion}
                    onChangeText={(text) => handleFormChange('ubicacion', text)}
                    maxLength={200}
                    editable={!editLoading}
                  />
                </View>

                {/* Sección de imagen */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Imagen del Evento (Opcional)</Text>
                  
                  {/* Mostrar imagen actual si existe */}
                  {selectedEvento?.imagen_url && !selectedImage && (
                    <View style={styles.currentImageContainer}>
                      <Text style={styles.currentImageLabel}>Imagen actual:</Text>
                      <Image
                        source={{ uri: selectedEvento.imagen_url }}
                        style={styles.currentImagePreview}
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.imagePickerButton}
                    onPress={handleSelectImage}
                    disabled={editLoading}
                  >
                    <MaterialCommunityIcons name="image-plus" size={24} color="#9D046D" />
                    <Text style={styles.imagePickerText}>
                      {selectedImage ? 'Cambiar Imagen' : 'Seleccionar Nueva Imagen'}
                    </Text>
                  </TouchableOpacity>

                  {/* Previsualización de nueva imagen */}
                  {selectedImage && (
                    <View style={styles.imagePreviewContainer}>
                      <Text style={styles.newImageLabel}>Nueva imagen:</Text>
                      <Image
                        source={{ uri: selectedImage.uri }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setSelectedImage(null)}
                        disabled={editLoading}
                      >
                        <MaterialCommunityIcons name="close-circle" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </ScrollView>

              {/* Botones de acción */}
              <View style={styles.createModalActions}>
                <TouchableOpacity
                  style={[styles.cancelCreateButton, editLoading && styles.disabledButton]}
                  onPress={handleCloseEditModal}
                  disabled={editLoading}
                >
                  <Text style={styles.cancelCreateButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.createSubmitButton, editLoading && styles.disabledButton]}
                  onPress={handleSaveEdit}
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="check" size={20} color="#fff" />
                      <Text style={styles.createSubmitButtonText}>Guardar Cambios</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
        </View>
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
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    padding: 8,
  },
  list: {
    padding: 8,
    paddingBottom: 90,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9D046D',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  gridItem: {
    width: imageSize,
    height: imageSize,
    margin: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    fontWeight: '500',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  overlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 4,
    fontWeight: 'bold',
    flex: 1,
  },
  // Estilos del modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    maxHeight: 400,
  },
  modalNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 5,
  },
  navButtonTextDisabled: {
    color: '#ccc',
  },
  modalImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  modalImagePlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInfo: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
    marginRight: 10,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  textSection: {
    marginTop: 10,
  },
  textLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textContent: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9D046D',
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Estilos del modal de creación
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  createModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  createModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  createModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  createModalBody: {
    maxHeight: 400,
  },
  formSection: {
    padding: 20,
    paddingBottom: 0,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 44,
  },
  formTextArea: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE6F7',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 8,
  },
  imagePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#9D046D',
    fontWeight: '600',
  },
  imagePreviewContainer: {
    marginTop: 12,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    padding: 4,
  },
  currentImageContainer: {
    marginBottom: 12,
  },
  currentImageLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  currentImagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  newImageLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  createModalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  cancelCreateButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelCreateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createSubmitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9D046D',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createSubmitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
