import React from 'react';
import { Stack } from 'expo-router';
import CreateUpdateScreen from '@/components/add/CreateUpdateScreen';

export default function NewUpdateRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <CreateUpdateScreen />
    </>
  );
}