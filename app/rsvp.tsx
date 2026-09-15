import React from 'react';
import { Stack } from 'expo-router';
import RSVPFeed from '@/components/event/RSVPFeed';

export default function RSVPRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <RSVPFeed />
    </>
  );
}