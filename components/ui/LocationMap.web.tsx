import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { MapPin } from 'lucide-react-native';

export default function LocationMap({ latitude, longitude, title }: { latitude: number | string, longitude: number | string, title: string }) {
  const openGoogleMaps = () => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
      <MapPin size={24} color="#9ca3af" style={{ marginBottom: 8 }} />
      <Text style={{ color: '#4b5563', fontWeight: 'bold', marginBottom: 8 }}>Interactive Map Unavailable on Web</Text>
      <TouchableOpacity 
        onPress={openGoogleMaps} 
        style={{ backgroundColor: '#1d4ed8', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Open in Google Maps</Text>
      </TouchableOpacity>
    </View>
  );
}