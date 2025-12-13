// app/(app)/PostDetail.js  -> Archivo de detalle de publicación/producto (Frontend)
// Este archivo es el encargado de mostrar el detalle de una publicación o producto específico.
// Muestra la información detallada del ítem seleccionado, incluyendo imágenes, descripciones y opciones de interacción.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { artesanoService } from '../../src/services/artesanoService';

const { width } = Dimensions.get('window');

export default function PostDetail() {
  const router = useRouter();
  const { itemId, itemType } = useLocalSearchParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadItemDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await artesanoService.getItemById(itemId, itemType);
      setItem(data);
    } catch (_) {
      Alert.alert('Error', 'No se pudo cargar el detalle.');
    } finally {
      setLoading(false);
    }
  }, [itemId, itemType]);

  useEffect(() => {
    if (itemId && itemType) {
      loadItemDetails();
    } else {
      Alert.alert('Error', 'No se pudo cargar el detalle del item.');
      router.back();
    }
  }, [itemId, itemType, loadItemDetails, router]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
      </TouchableOpacity>
      <View style={styles.headerProfile}>
        {item?.artesanos?.avatar_url ? (
          <Image source={{ uri: item.artesanos.avatar_url }} style={styles.headerAvatar} />
        ) : (
          <View style={styles.defaultAvatar}>
            <MaterialCommunityIcons name="account" size={20} color="#666" />
          </View>
        )}
        <Text style={styles.headerTitle}>{item?.artesanos?.nombre || 'Artesano'}</Text>
      </View>
      <View style={{ width: 40 }} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9D046D" />
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Text>No se encontró el item.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView>
        {item.imagen_url && (
          <Image source={{ uri: item.imagen_url }} style={styles.postImage} />
        )}

        <View style={styles.contentContainer}>
          {itemType === 'publicaciones' && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialCommunityIcons name="heart-outline" size={28} color="#333" />
              </TouchableOpacity>
              <Text style={styles.likesText}>{item.likes_count || 0} Me gusta</Text>
            </View>
          )}

          {itemType === 'productos' && (
            <View style={styles.productInfoContainer}>
              <Text style={styles.productPrice}>${item.precio || '0.00'}</Text>
              <TouchableOpacity style={styles.buyButton}>
                <Text style={styles.buyButtonText}>Contactar para comprar</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.description}>
            <Text style={styles.descriptionUser}>{item.artesanos?.nombre} </Text>
            {item.descripcion || 'Sin descripción.'}
          </Text>

          <Text style={styles.dateText}>
            Publicado el {new Date(item.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: { padding: 8 },
  headerProfile: { flexDirection: 'row', alignItems: 'center' },
  headerAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  defaultAvatar: {
    width: 32, height: 32, borderRadius: 16, marginRight: 10,
    backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center'
  },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  postImage: {
    width: width,
    height: width, // Imagen cuadrada
    backgroundColor: '#f0f0f0',
  },
  contentContainer: { padding: 16 },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButton: { marginRight: 16 },
  likesText: { fontSize: 14, fontWeight: 'bold' },
  productInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  productPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#9D046D',
  },
  buyButton: {
    backgroundColor: '#9D046D',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  description: { fontSize: 14, lineHeight: 20 },
  descriptionUser: { fontWeight: 'bold' },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
  },
});