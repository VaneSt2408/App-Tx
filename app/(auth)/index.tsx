import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link, router } from 'expo-router';
import { MotiView, MotiText, MotiImage } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedProps, withRepeat, withTiming, Easing, interpolateColor } from 'react-native-reanimated';
import React from 'react';

// Creamos un componente Animated a partir de LinearGradient para poder animar sus props
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

// Definimos un tipo explícito para las propiedades que vamos a animar
type AnimatedGradientProps = {
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  colors?: readonly string[];
};

// Define diferentes conjuntos de colores para la animación
const COLOR_SETS = [
  ['#5D0C64', '#AE146E', '#EBD423'], // Morado oscuro, fucsia brillante, naranja cálido (Original)
  ['#00C6FF', '#0072FF', '#8E2DE2'], // Azul cielo, azul oscuro, morado vibrante
  ['#FF00CC', '#333399', '#FF6600'], // Rosa brillante, azul marino, naranja intenso
  ['#4CAF50', '#8BC34A', '#CDDC39'], // Verde esmeralda, verde lima, amarillo verdoso
];

// --- La pantalla principal (CORREGIDA) ---
export default function Index() {
  const rotation = useSharedValue(0);
  const colorProgress = useSharedValue(0); // Valor para controlar la transición de colores

  React.useEffect(() => {
    // Inicia una animación de rotación infinita y lineal para el ángulo del gradiente.
    rotation.value = withRepeat(
      withTiming(360, { duration: 10000, easing: Easing.linear }), // Duración ajustada para un efecto más etéreo
      -1 // -1 para repetición infinita
    );

    // Anima colorProgress de 0 a (número de sets - 1) para ciclar por los conjuntos de colores
    colorProgress.value = withRepeat(
      withTiming(COLOR_SETS.length - 1, { duration: 20000, easing: Easing.linear }), // 20 segundos para un ciclo completo de colores
      -1, // Repetición infinita
      true // Invierte la animación (efecto yo-yo) para un bucle suave e infinito
    );
  }, []);
  
  const animatedProps = useAnimatedProps((): AnimatedGradientProps => {
    const angleRad = (rotation.value * Math.PI) / 180; // Convertir grados a radianes

    // Centro del gradiente (coordenadas normalizadas de 0 a 1)
    const centerX = 0.5;
    const centerY = 0.5;
    // Radio para asegurar que la línea del gradiente siempre cubra las esquinas
    const radius = Math.sqrt(0.5 * 0.5 + 0.5 * 0.5); 

    // Calcular los puntos de inicio y fin del gradiente basándose en el ángulo de rotación
    const startX = centerX - radius * Math.cos(angleRad);
    const startY = centerY - radius * Math.sin(angleRad);
    const endX = centerX + radius * Math.cos(angleRad);
    const endY = centerY + radius * Math.sin(angleRad);

    // Lógica de interpolación de colores
    const lowerIndex = Math.floor(colorProgress.value);
    const upperIndex = (lowerIndex + 1) % COLOR_SETS.length; // Lógica circular para el índice
    const progress = colorProgress.value % 1; // Progreso siempre entre 0 y 1

    const currentColors = COLOR_SETS[lowerIndex];
    const nextColors = COLOR_SETS[upperIndex];

    const interpolatedColors: string[] = currentColors.map((_, i) =>
      interpolateColor(progress, [0, 1], [currentColors[i], nextColors[i]]) as string
    );

    return {
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
      colors: interpolatedColors,
    };
  });

  return (
    <View style={styles.container}>
      <View className="flex-1 w-full h-full absolute inset-0">
        <AnimatedGradient
          locations={[0.1, 0.5, 0.9]} // Puntos de parada para los colores del gradiente
          animatedProps={animatedProps} // Propiedades animadas (colores y ángulo)
          style={StyleSheet.absoluteFill} // Estilo para que ocupe todo el fondo
        />
      </View>
      <StatusBar style="light" />

      <SafeAreaView
        style={styles.content}
        className="justify-between items-center w-full p-4"
      >
        {/* Espaciador superior (se mantiene igual) */}
        <View className="flex-1" />

        {/* Título (se mantiene igual) */}
        <MotiView
          className="items-center flex-1 justify-center"
          from={{ opacity: 0, translateY: -40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800 }}
        >
          <MotiImage
            source={require('../../assets/images/LogoSV.png')}
            className="w-89 h-80 mb-4" // Ajusta el tamaño según necesites
            style={{ resizeMode: 'contain' }}
          />

          <MotiText
            className="text-white text-4xl font-extralight tracking-wide shadow-md mb-9 shadow-black/50"
            from={{ opacity: 0, translateY: 40 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 800, delay: 300 }}
          >
            Tx Guide
          </MotiText>
        </MotiView>

        <MotiView
          className="w-full items-center"
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 900 }}
        >
          <Link href="/auth" asChild replace>
            <TouchableOpacity className="w-11/12 bg-white/20 p-5 rounded-3xl items-center mb-8 border border-white/30">
              <Text className="text-white text-2xl font-semibold">
                BIENVENIDO DE VUELTA →
              </Text>
            </TouchableOpacity>
          </Link>
        </MotiView>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black', // Fondo de respaldo
  },
  content: {
    flex: 1,
  },
});