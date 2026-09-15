import React from 'react';
import { Stack } from 'expo-router';
import PantryScreen from '@/components/pantry/PantryScreen';

export default function PantryRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PantryScreen />
    </>
  );
}