import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import FeaturedCard from './FeaturedCard';
import EventsModal from './EventsModal';
import { estadisticasService } from '../src/services/estadisticasService';
import { getEvents } from '../src/services/eventsService';

const FeaturedSection = () => {
  const [artesanos, setArtesanos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const artesanosData = await estadisticasService.getTop5ArtesanosByLikes();
        const eventosRes = await getEvents();

        if (!mounted) return;

        setArtesanos(Array.isArray(artesanosData) ? artesanosData : []);
        setEventos(eventosRes?.success ? eventosRes.data : []);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Error al cargar destacados');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#9D046D" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Artesanos destacados: solo nombre, foto y likes (usar FeaturedCard) */}
      <Text style={styles.sectionTitle}>Artesanos destacados</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {artesanos.map((a) => (
          <View key={a.user_id || a.id} style={styles.artesanoItem}>
            <FeaturedCard type="artesano" item={a} />
          </View>
        ))}
      </ScrollView>

      {/* Eventos: mostrar toda la información en un scroll horizontal */}
      <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Eventos</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {eventos.map((ev) => (
          <View key={ev.id} style={styles.eventItemHorizontal}>
            <FeaturedCard type="evento" item={ev} onPress={() => { setSelectedEvent(ev); setModalVisible(true); }} />
          </View>
        ))}
      </ScrollView>

      <EventsModal visible={modalVisible} event={selectedEvent} onClose={() => { setModalVisible(false); setSelectedEvent(null); }} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    padding: 12,
  },
  center: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  horizontalScroll: {
    marginBottom: 8,
  },
  artesanoItem: {
    width: 180,
    marginRight: 10,
  },
  eventItem: {
    marginBottom: 10,
  },
  eventItemHorizontal: {
    width: 260,
    marginRight: 10,
  },
  errorText: {
    color: '#c0392b',
  },
});

export default FeaturedSection;
