import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, Image, Linking } from 'react-native';
import { supabase } from '@/lib/supabase'; 
import { useRouter } from 'expo-router';
import { useAuth } from '@/components/context/AuthContext';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { setMode } = useAuth(); 

  async function signUpWithEmail() {
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      Alert.alert('Missing Info', 'Please fill out all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Your passwords do not match. Please try again.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          first_name: firstName, 
          last_name: lastName,
        },
      },
    });

    setLoading(false);

    if (error) {
      Alert.alert('Signup Error', error.message);
    } else {
      Alert.alert('Success!', 'Your account has been created.');
      setMode('consumer');
      router.replace('/(tabs)');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Join</Text>
      <Image
        source={require('@/assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={signUpWithEmail} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>
      
      {/* NEW: Apple Required Terms of Service & Privacy Links */}
      <View style={styles.legalContainer}>
        <Text style={styles.legalText}>
          By creating an account, you agree to our{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('https://maritimes.duckdns.org/terms-of-service-privacy-policy/')}>
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('https://maritimes.duckdns.org/terms-of-service-privacy-policy/')}>
            Privacy Policy
          </Text>.
        </Text>
      </View>
      
      <TouchableOpacity 
        style={{ alignItems: 'center', padding: 15, marginTop: 10 }} 
        onPress={() => router.back()}
      >
        <Text style={{ color: '#666', fontSize: 16, fontWeight: '600' }}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  welcomeText: { fontSize: 22, fontWeight: '600', color: '#666', textAlign: 'center', marginBottom: 5 },
  logo: { width: '100%', height: 100, marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#1d4ed8', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  legalContainer: { marginTop: 15, paddingHorizontal: 10 },
  legalText: { fontSize: 12, color: '#6b7280', textAlign: 'center', lineHeight: 18 },
  link: { color: '#1d4ed8', fontWeight: '600' }
});