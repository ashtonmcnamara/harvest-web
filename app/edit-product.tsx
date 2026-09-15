import React from 'react';
import { Stack } from 'expo-router';
import EditProductScreen from '@/components/edit/EditProductScreen';

export default function EditProductRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <EditProductScreen />
    </>
  );
}