import React from 'react';
import MapView, { Marker } from 'react-native-maps';

export default function LocationMap({ latitude, longitude, title }: { latitude: number | string, longitude: number | string, title: string }) {
  return (
    <MapView 
      style={{ flex: 1 }}
      initialRegion={{
        latitude: Number(latitude), 
        longitude: Number(longitude),
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      <Marker 
        coordinate={{ latitude: Number(latitude), longitude: Number(longitude) }} 
        title={title} 
      />
    </MapView>
  );
}