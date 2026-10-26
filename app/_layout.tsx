import { Platform, View, TouchableOpacity, Text } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { AuthProvider, useAuth } from '@/components/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LayoutDashboard } from 'lucide-react-native';
import '../global.css'; 

function RootLayoutInner() {
  const pathname = usePathname();
  const router = useRouter();
  const { userMode } = useAuth();
  const isWebDashboard = pathname.startsWith('/dashboard');

  return (
    <>
      {Platform.OS === 'web' && !isWebDashboard ? (
        // ADDED: py-8 (vertical padding) to create space at the top and bottom
        <View style={{ flex: 1, height: '100vh', overflow: 'hidden' }} className="bg-gray-100 items-center justify-center relative py-8">
          
          {(userMode === 'producer' || userMode === 'admin') && (
            <TouchableOpacity 
              onPress={() => router.replace('/dashboard')}
              style={{ position: 'absolute', top: 24, left: 24, zIndex: 50, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}
              className="bg-[#1d4ed8] flex-row items-center px-4 py-3 rounded-xl"
            >
              <LayoutDashboard size={20} color="white" />
              <Text className="text-white font-bold ml-2">Return to Dashboard</Text>
            </TouchableOpacity>
          )}

          {/* ADDED: borderRadius: 32 and height: '100%' to match the dashboard feed frame */}
          <View style={{ flex: 1, width: '100%', maxWidth: 448, height: '100%', borderRadius: 32 }} className="bg-white shadow-2xl overflow-hidden border border-gray-200">
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="login" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="dashboard" />
            </Stack>
          </View>
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="dashboard" />
        </Stack>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AuthProvider>
        <RootLayoutInner />
      </AuthProvider>
    </SafeAreaProvider>
  );
}