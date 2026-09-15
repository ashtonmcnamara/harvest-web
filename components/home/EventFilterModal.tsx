import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { X } from 'lucide-react-native';

const EVENT_TYPES = ['Market', 'Workshop', 'Tour', 'Festival', 'Other'];
const COUNTIES = ['Halifax', 'Kings', 'Annapolis', 'Lunenburg', 'Pictou', 'Hants'];

export default function EventFilterModal({ visible, onClose, onApply, currentFilters }: any) {
  const insets = useSafeAreaInsets();
  
  const [types, setTypes] = useState<string[]>([]);
  const [counties, setCounties] = useState<string[]>([]);

  useEffect(() => {
    if (visible && currentFilters) {
      setTypes(currentFilters.types || []);
      setCounties(currentFilters.counties || []);
    }
  }, [visible, currentFilters]);

  const toggleArrayItem = (setter: any, item: string) => {
    setter((prev: string[]) => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const Pill = ({ label, isSelected, onPress }: any) => (
    <TouchableOpacity onPress={onPress} className={`px-4 py-2 rounded-full border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
      <Text className={`text-sm ${isSelected ? 'font-bold text-blue-700' : 'text-gray-700 font-medium'}`}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        
        <View className="flex-row items-center justify-between px-4 pb-4 border-b border-gray-100">
          <TouchableOpacity onPress={onClose} className="p-2 -ml-2"><X size={24} color="#333" /></TouchableOpacity>
          <Text className="text-xl font-bold text-black">Filter Events</Text>
          <TouchableOpacity onPress={() => onApply({ types, counties })} className="p-2 -mr-2">
            <Text className="text-[#1d4ed8] font-semibold text-base">Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          
          <Text className="text-lg font-bold mt-6 mb-4 text-black">Event Type</Text>
          <View className="flex-row flex-wrap gap-2.5">
            {EVENT_TYPES.map(t => <Pill key={t} label={t} isSelected={types.includes(t)} onPress={() => toggleArrayItem(setTypes, t)} />)}
          </View>

          <Text className="text-lg font-bold mt-8 mb-4 text-black">County</Text>
          <View className="flex-row flex-wrap gap-2.5 mb-10">
            {COUNTIES.map(c => <Pill key={c} label={c} isSelected={counties.includes(c)} onPress={() => toggleArrayItem(setCounties, c)} />)}
          </View>

        </ScrollView>
      </View>
    </Modal>
  );
}