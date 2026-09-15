import React from 'react';
import { Stack } from 'expo-router';
import SavedFeed from '@/components/saved/SavedFeed';
import { useRouter } from 'expo-router';

export default function SavedRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SavedFeed />
    </>
  );
}