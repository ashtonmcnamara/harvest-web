import React from 'react';
import { Stack } from 'expo-router';
import ChatRoom from '@/components/messages/ChatRoom';

export default function MessageRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ChatRoom />
    </>
  );
}