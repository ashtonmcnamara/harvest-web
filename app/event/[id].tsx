import React from 'react';
import { Stack } from 'expo-router';
import EventProfile from '@/components/event/EventProfile';

export default function EventRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <EventProfile />
    </>
  );
}