// En: src/pages/NotFoundPage.js

import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { supabase } from '../supabase/client';

export default function NotFoundPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Error de Permisos</Text>
      <Text style={styles.message}>
        No tienes un rol definido en el sistema. Por favor, contacta a un administrador.
      </Text>
      <Button title="Cerrar Sesión" onPress={() => supabase.auth.signOut()} color="#db4437" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
});