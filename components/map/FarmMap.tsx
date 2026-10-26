import MapView, { Marker } from 'react-native-maps';

export default function FarmMap({ location }) {
  return (
    <MapView 
      style={{ width: '100%', height: 250 }}
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      <Marker coordinate={location} />
    </MapView>
  );
}