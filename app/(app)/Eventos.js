// app/(app)/Eventos.js
import React, { useState, useCallback} from 'react';
import { View, Text as DefaultText, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import EventCard from '../../components/FeaturedCard'; // Reutilizamos el mismo componente de la FeedPage
import EventsModal from '../../components/EventsModal'; // 1. Importar el modal
import { getEvents, deleteEvent } from '../../src/services/eventsService';

// Aseguramos que las fuentes personalizadas estén cargadas
const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
  );

// Página de gestión de eventos
const EventosPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null); // 2. Estado para el evento seleccionado
  const [modalVisible, setModalVisible] = useState(false); // 3. Estado para la visibilidad del modal

   // Cargar eventos desde la API
  const loadEvents = async () => {
    const result = await getEvents();
    if (result.success) {
      setEvents(result.data);
    }
    setLoading(false);
  };
// Cargar eventos al montar el componente
useFocusEffect(
  useCallback(() => {
    loadEvents();
    return () => { };
  }, [])
);

  // Manejar eliminación de evento
  const handleDeleteEvent = async (eventId) => {
    Alert.alert(
      '¿Eliminar evento?',
      'Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteEvent(eventId);
            if (result.success) {
              setEvents(prevEvents => prevEvents.filter(ev => ev.id !== eventId));
            } else {
              Alert.alert('Error', 'No se pudo eliminar el evento. Inténtalo de nuevo.');
            }
          },
        },
      ]
    );
  };

  const handleEditEvent = (item) => {
    router.push({ pathname: './EditEventPage', params: item });
  }

  // Manejar edición de evento (navegar a la página de edición)
  const renderEvent = ({ item }) => (
    <View className="mb-3 bg-white rounded-xl overflow-hidden shadow-sm p-4">
      {/* 4. Pasar la prop onPress para abrir el modal */}
      <EventCard 
        type="evento" 
        item={item} 
        onPress={() => { setSelectedEvent(item); setModalVisible(true); }}
      />
      <View className="flex-row justify-end mt-2">
        <TouchableOpacity
          className="bg-red-500 px-3 py-1.5 rounded-lg"
          onPress={() => handleDeleteEvent(item.id)}
        >
          <Text style={{fontFamily: 'Alan Sans'}} className="text-white text-sm font-medium">Eliminar</Text>
        </TouchableOpacity>

        {/* Botón de Editar (NUEVO) */}
        <TouchableOpacity
          className="bg-[#9D046D] px-4 py-1.5 rounded-lg mr-4 left-3" // Añadimos margen a la derecha
          onPress={() => handleEditEvent(item)} // Necesitarás crear esta función
        >
          <Text className="text-white text-sm font-medium">Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text style={{fontFamily: 'Alan Sans'}} className="text-xl font-bold text-gray-900">Gestión de Eventos</Text>
        <TouchableOpacity
          className="w-10 h-10 bg-[#9D046D] rounded-full justify-center items-center"
          onPress={() => router.push('./CreateEventPage')}
        >
          <Text className="text-white text-2xl font-bold">+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#9D046D" />
        </View>
      ) : events.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">No hay eventos creados aún.</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 5. Añadir el componente del modal a la pantalla */}
      <EventsModal 
        visible={modalVisible} 
        event={selectedEvent} 
        onClose={() => { 
          setModalVisible(false); 
          setSelectedEvent(null); 
        }} 
      />
    </View>
  );
};

export default EventosPage;