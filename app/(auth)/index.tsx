import { View, Text as DefaultText, SafeAreaView, TouchableOpacity, StyleSheet, Image, type TextProps } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link, router } from 'expo-router';
import { MotiView, MotiText, MotiImage } from 'moti';
import React from 'react';
import useCustomFonts from '../../hooks/useFonts';


const Text = (props: TextProps) => (
    <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
  );

// --- La pantalla principal (CORREGIDA) ---
export default function Index() {

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <SafeAreaView
        style={styles.content}
        className="justify-between items-center w-full p-4"
      >
        {/* Título (se mantiene igual) */}
        <MotiView
          className="items-center flex-1 justify-center"
          from={{ opacity: 0, translateY: -40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800 }}
        >
          <MotiImage
            source={require('../../assets/images/LogoDöniAppOficial.png')}
            className="w-80 h-80 mb-4" // Ajusta el tamaño según necesites
            style={{ resizeMode: 'contain' }}
          />

          <MotiText
            style={{fontFamily: 'Alan Sans'}}
            className="text-white text-4xl font-extralight tracking-wide shadow-md mb-9 shadow-black/50"
            from={{ opacity: 0, translateY: 40 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 800, delay: 300 }}
            
          >
            DöniApp
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
              <Text style={{fontFamily: 'Alan Sans', fontSize: 20, fontWeight: 'bold'}} className="text-white">
                BIENVENIDO →
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
    backgroundColor: '#A23353', // Fondo de color sólido
  },
  content: {
    flex: 1,
  },
});