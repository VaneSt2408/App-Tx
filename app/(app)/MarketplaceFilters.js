// app/(app)/MarketplaceFilters.js
// Pantalla de filtros para el Marketplace
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFilter } from '../../src/context/FilterContext'; // Corregido de useFilters a useFilter si es necesario

// Lista de ejemplo, idealmente vendría de una API
const CATEGORIAS_EJEMPLO = [
  'Textil', 'Alfarería', 'Joyería', 
  'Madera', 'Piel', 'Piedra', 'Vidrio', 
  'Metal', 'Cerámica', 'Cestería', 
  'Fibras', 'Minerales'
];

// Componente principal de filtros
// NO MODIFICAR
export default function MarketplaceFilters() {
  const router = useRouter();
  const { filters, applyFilters, clearFilters } = useFilter(); // Obtenemos los filtros actuales del contexto
  const [selectedCategories, setSelectedCategories] = useState(filters.categories || []);
  const [priceRange, setPriceRange] = useState(filters.priceRange || { min: '', max: '' });
  const [location, setLocation] = useState(filters.location || '');

  // NO MODIFICAR
  // Sincroniza el estado local con el contexto cuando los filtros del contexto cambian.
  useEffect(() => {
    // Los TextInput esperan strings. Si los valores en el contexto son números, los convertimos.
    const minPrice = filters.priceRange?.min?.toString() || '';
    const maxPrice = filters.priceRange?.max?.toString() || '';

    setSelectedCategories(filters.categories || []);
    setPriceRange({ min: minPrice, max: maxPrice });
    setLocation(filters.location || '');
  }, [filters]);

  // NO MODIFICAR
  // Maneja la selección y deselección de categorías
  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // NO MODIFICAR
  // Maneja la acción de limpiar filtros
  const handleClear = () => {
    setSelectedCategories([]);
    setPriceRange({ min: '', max: '' });
    setLocation('');
    clearFilters();
  };

  // NO MODIFICAR
  // Maneja la acción de aplicar filtros
  const handleApply = () => {
    // Convertir los precios a números antes de aplicar el filtro.
    const numericPriceRange = {
      min: priceRange.min ? parseFloat(priceRange.min) : null,
      max: priceRange.max ? parseFloat(priceRange.max) : null,
    };

    applyFilters({
      categories: selectedCategories,
      priceRange: numericPriceRange,
      location, 
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filtros</Text>
        <TouchableOpacity onPress={handleClear} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Sección de Categorías */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          <View style={styles.categoryContainer}>
            {CATEGORIAS_EJEMPLO.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategories.includes(category) && styles.categoryChipSelected
                ]}
                onPress={() => toggleCategory(category)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategories.includes(category) && styles.categoryChipTextSelected
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sección de Rango de Precios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rango de Precios</Text>
          <View style={styles.priceRangeContainer}>
            <TextInput
              style={styles.priceInput}
              placeholder="Mínimo"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={priceRange.min}
              onChangeText={text => setPriceRange(prev => ({ ...prev, min: text }))}
            />
            <Text style={styles.priceSeparator}>-</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="Máximo"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={priceRange.max}
              onChangeText={text => setPriceRange(prev => ({ ...prev, max: text }))}
            />
          </View>
        </View>

        {/* Sección de Ubicación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación</Text>
          <View style={styles.locationInputContainer}>
            <MaterialCommunityIcons name="magnify" size={22} color="#999" style={styles.locationInputIcon} />
            <TextInput
              style={styles.locationInput}
              placeholder="Buscar por ciudad o estado"
              placeholderTextColor="#999"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>
      </ScrollView>

      {/* Botón de Aplicar */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#9D046D',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#e9ecef',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  categoryChipSelected: {
    backgroundColor: '#FBDAF4',
    borderColor: '#9D046D',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#495057',
  },
  categoryChipTextSelected: {
    color: '#9D046D',
    fontWeight: 'bold',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#9D046D',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  priceSeparator: {
    fontSize: 18,
    color: '#6c757d',
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9D046D',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  locationInputIcon: {
    marginRight: 8,
  },
  locationInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  applyButton: {
    backgroundColor: '#9D046D',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});