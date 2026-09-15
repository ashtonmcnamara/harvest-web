import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/components/context/AuthContext';
import { LoginScreen } from '@/components/auth/LoginScreen';

export default function Login() {
  const { userMode, setMode } = useAuth();

  // If logged in, go to the tabs (which is now the default root '/')
  if (userMode) {
    return <Redirect href="/" />;
  }

  return <LoginScreen onLogin={(mode) => setMode(mode)} />;
}