// app/(app)/Eventos.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventCard from '../../components/FeaturedCard'; // Reutilizamos el mismo componente de la FeedPage

const EVENTOS_KEY = '@eventos_admin';

const EventosPage = () => {
  const router = useRouter();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    try {
      const storedEvents = await AsyncStorage.getItem(EVENTOS_KEY);
      setEventos(storedEvents ? JSON.parse(storedEvents) : []);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      Alert.alert('Error', 'No se pudieron cargar los eventos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

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
            try {
              const updatedEvents = eventos.filter(event => event.id !== eventId);
              await AsyncStorage.setItem(EVENTOS_KEY, JSON.stringify(updatedEvents));
              setEventos(updatedEvents);
              Alert.alert('Éxito', 'El evento ha sido eliminado.');
            } catch (error) {
              console.error('Error al eliminar evento:', error);
              Alert.alert('Error', 'No se pudo eliminar el evento.');
            }
          },
        },
      ]
    );
  };

  const renderEvent = ({ item }) => (
    <View className="mb-3 bg-white rounded-xl overflow-hidden shadow-sm p-4">
      <EventCard event={item} />
      <View className="flex-row justify-end mt-2">
        <TouchableOpacity
          className="bg-red-500 px-3 py-1.5 rounded-lg"
          onPress={() => handleDeleteEvent(item.id)}
        >
          <Text className="text-white text-sm font-medium">Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold text-gray-900">Gestión de Eventos</Text>
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
      ) : eventos.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">No hay eventos creados aún.</Text>
        </View>
      ) : (
        <FlatList
          data={eventos}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default EventosPage;