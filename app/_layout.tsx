import { Stack } from 'expo-router';
import { AuthProvider } from '@/components/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css'; 

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}