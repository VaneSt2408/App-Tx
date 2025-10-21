// app/(auth)/_layout.tsx
import { Slot } from 'expo-router';

// Este componente simplemente le dice a Expo Router que renderice 
// la pantalla actual que corresponda a este grupo (ej. index.tsx o auth.tsx).
export default function AuthLayout() {
  return <Slot />;
}