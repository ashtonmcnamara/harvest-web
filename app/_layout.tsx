import { Platform, View, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { AuthProvider, useAuth } from '@/components/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LayoutDashboard } from 'lucide-react-native';
import '../global.css'; 

function RootLayoutInner() {
  const pathname = usePathname();
  const router = useRouter();
  const { userMode } = useAuth();
  const { width } = useWindowDimensions();
  
  const isWebDashboard = pathname.startsWith('/dashboard');
  
  // Checks if the browser width is mobile-sized (less than 768px)
  const isMobileScreen = width < 768;

  return (
    <>
      {Platform.OS === 'web' && !isWebDashboard ? (
        <View 
          style={{ flex: 1, height: '100vh', overflow: 'hidden' }} 
          className={isMobileScreen ? "bg-white items-center justify-center" : "bg-gray-100 items-center justify-center relative py-8"}
        >
          
          {/* Only show the floating dashboard button on desktop-sized screens */}
          {!isMobileScreen && (userMode === 'producer' || userMode === 'admin') && (
            <TouchableOpacity 
              onPress={() => router.replace('/dashboard')}
              style={{ position: 'absolute', top: 24, left: 24, zIndex: 50, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}
              className="bg-[#1d4ed8] flex-row items-center px-4 py-3 rounded-xl"
            >
              <LayoutDashboard size={20} color="white" />
              <Text className="text-white font-bold ml-2">Return to Dashboard</Text>
            </TouchableOpacity>
          )}

          {/* If mobile screen, it fills the screen completely with 0 border-radius. If desktop, it uses the phone frame. */}
          <View 
            style={isMobileScreen ? { flex: 1, width: '100%', height: '100%' } : { flex: 1, width: '100%', maxWidth: 448, height: '100%', borderRadius: 32 }} 
            className={isMobileScreen ? "bg-white overflow-hidden" : "bg-white shadow-2xl overflow-hidden border border-gray-200"}
          >
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