import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { useEffect } from 'react';

const { width } = Dimensions.get('window');

// --- Tu pantalla principal (CORREGIDA) ---
export default function Index() {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(-width, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
  }, []);

  const animatedGradientStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Fondo animado */}
      <Animated.View style={[styles.gradientContainer, animatedGradientStyle]}>
        <LinearGradient
          colors={['#5F1139', '#AE146E', '#610C69', '#5414AE']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        />
      </Animated.View>

      <SafeAreaView
        style={styles.content}
        className="flex-1 justify-between items-center w-full p-4"
      >
        {/* Espaciador superior (se mantiene igual) */}
        <View className="flex-1" />

        {/* Título (se mantiene igual) */}
        <View className="items-center flex-1 justify-center">
          <Text className="text-white text-7xl mb-4 shadow-lg shadow-black/50">
            TxTour
          </Text>
          <Text className="text-white text-4xl font-extralight tracking-wide shadow-md shadow-black/50">
            Tx Guide
          </Text>
        </View>

        {/*
          MEJORA: He agrupado el Logo y el Botón en un solo View contenedor
          para asegurar que siempre permanezcan juntos en la parte inferior.
        */}
        <View className="w-full items-center">
          <View className="flex-none justify-end items-center mb-8">
            <Text className="text-white text-lg opacity-50">
              Logo
            </Text>
          </View>

          <Link href="/auth" asChild>
            <TouchableOpacity className="w-11/12 bg-white/20 p-5 rounded-3xl items-center mb-8 border border-white/30">
              <Text className="text-white text-2xl font-semibold">
                Empieza aquí →
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

      </SafeAreaView>
    </View>
  );
}

// --- Estilos (sin cambios) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5D0C64',
  },
  gradientContainer: {
    ...StyleSheet.absoluteFillObject,
    width: width * 2,
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});