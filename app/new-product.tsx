import React from 'react';
import { Stack } from 'expo-router';
import CreateProductScreen from '@/components/add/CreateProductScreen';

export default function NewProductRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <CreateProductScreen />
    </>
  );
}