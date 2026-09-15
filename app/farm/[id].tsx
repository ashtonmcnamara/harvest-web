import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import FarmProfile from '@/components/farm/FarmProfile';

export default function FarmScreen() {
  // This hook grabs the actual ID from the URL (e.g., 'farm_123')
  // We will pass this to the backend later, but for now, we just let the UI render!
  const { id } = useLocalSearchParams();

  return (
    <>
      {/* Tell Expo Router to hide the default top navigation bar so our custom image header fits perfectly */}
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Drop in the UI component we built */}
      <FarmProfile />
    </>
  );
}