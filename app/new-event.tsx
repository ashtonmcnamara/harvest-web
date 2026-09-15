import React from 'react';
import { Stack } from 'expo-router';
import CreateEventScreen from '@/components/add/CreateEventScreen';

export default function NewEventRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <CreateEventScreen />
    </>
  );
}