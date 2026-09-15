import React from 'react';
import { Stack } from 'expo-router';
import EditFarmScreen from '@/components/edit/EditFarmScreen'; // Make sure this path matches where you saved it!

export default function EditFarmRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <EditFarmScreen />
    </>
  );
}