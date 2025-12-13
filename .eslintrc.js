module.exports = {
  // *** 1. Agregar la configuración base de Expo aquí: ***
  extends: [
    'expo', 
    // Añadimos la recomendada para Hooks (rendimiento)
    'plugin:react-hooks/recommended' 
  ], 
  // *** 2. Asegurarnos de que el analizador de Babel esté configurado: ***
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false, // Es necesario para el parser de Babel
    babelOptions: {
      presets: ['module:metro-react-native-babel-preset'],
    },
  },
  
  // *** 3. Mantener y complementar tus reglas personalizadas: ***
  plugins: [
    'react',
    'react-native',
    'react-hooks', 
    // Opcional: Agregar seguridad
    // 'security'
  ],
  rules: {
    // Reglas de Rendimiento (Hooks):
    'react-hooks/rules-of-hooks': 'error', 
    'react-hooks/exhaustive-deps': 'warn', // <-- Regla Clave de Rendimiento
    
    // Regla de React Native:
    'react-native/no-inline-styles': 'warn', 
    // ... otras reglas que desees
  },
};