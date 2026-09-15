import React from 'react';
import { Stack } from 'expo-router';
import EditEventScreen from '@/components/edit/EditEventScreen'; // Make sure this path matches where you saved it!

export default function EditEventRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <EditEventScreen />
    </>
  );
}