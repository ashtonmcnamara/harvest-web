// FarmMap.web.tsx
import { View, Text } from 'react-native';

export default function FarmMap({ location }) {
  return (
    <View className="h-64 bg-gray-200 items-center justify-center rounded-lg">
      <Text className="text-gray-500 font-medium">Map available in the HarvestNS mobile app</Text>
    </View>
  );
}