import React from 'react';
import { Stack } from 'expo-router';
import AddProductsScreen from '@/components/pantry/AddProductsScreen';

export default function PantryAddRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AddProductsScreen />
    </>
  );
}