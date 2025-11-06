// components/EventCarousel.js
import React from 'react';
import { View, Text as DefaultText, ScrollView, TouchableOpacity, Image} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useCustomFonts from '../hooks/useFonts';

const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'AlanSans' }, props.style]} />
  );

const EventCarousel = ({ events = [], onEventPress }) => {
  // Función para formatear la fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    } catch (e) {
      return dateString;
    }
  };

  // Función para formatear la hora
  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    } catch (e) {
      return timeString;
    }
  };

  return (
    <View className="mb-4">
      {/* Header "Próximos Eventos" */}
      <View className="flex-row items-center mb-2 px-4">
        <MaterialCommunityIcons name="calendar-multiselect" size={28} color="#9D046D" />
        <Text style={{fontFamily: 'AlanSans'}} className="ml-1 text-xl font-semibold text-gray-900">Próximos Eventos</Text>
      </View>

      {/* Carrusel Horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {events.map((event) => (
          <TouchableOpacity
            key={event.id}
            className="w-80 mr-4 bg-white rounded-xl overflow-hidden shadow-sm"
            onPress={() => onEventPress?.(event)} // Opcional: manejar la pulsación
          >
            {/* Imagen */}
            {event.imagen_url ? (
              <Image source={{ uri: event.imagen_url }} className="w-full h-40" resizeMode="cover" />
            ) : (
              <View className="w-full h-40 bg-gray-200 justify-center items-center">
                <MaterialCommunityIcons name="calendar" size={32} color="#999" />
              </View>
            )}

            {/* Contenido */}
            <View className="p-4">
              <Text style={{fontFamily: 'AlanSans'}} className="text-base font-semibold text-gray-900 mb-2">{event.nombre}</Text>
              <View className="flex-row items-center mb-1">
                <MaterialCommunityIcons name="calendar" size={14} color="#666" />
                <Text style={{fontFamily: 'AlanSans'}} className="ml-1 text-xs text-gray-600">{formatDate(event.fecha)}</Text>
              </View>
              <View className="flex-row items-center mb-1">
                <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
                <Text style={{fontFamily: 'AlanSans'}} className="ml-1 text-xs text-gray-600">{formatTime(event.hora)}</Text>
              </View>
              <View className="flex-row items-start">
                <MaterialCommunityIcons name="map-marker" size={14} color="#666" />
                <Text style={{fontFamily: 'AlanSans'}} className="ml-1 text-xs text-gray-600 flex-1">{event.ubicacion}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default EventCarousel;