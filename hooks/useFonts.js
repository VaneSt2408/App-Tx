// hooks/useFonts.js
import { useFonts } from 'expo-font';

export default function useCustomFonts() {
  const [fontsLoaded] = useFonts({
    'AlanSans-VariableFont_wght': require('../assets/fonts/AlanSans-VariableFont_wght.ttf'),
    'ElmsSans-VariableFont_wght': require('../assets/fonts/ElmsSans-VariableFont_wght.ttf'),
    // Añade más fuentes aquí si necesitas
  });

  return fontsLoaded;
}