import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text } from '@/components/ui/text';
import { X } from 'lucide-react-native';

interface DateTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (dateString: string) => void;
}

// Fixed lists for the picker logic
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const YEARS = ['2023', '2024', '2025', '2026'];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINS = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'];

export default function DateTimePickerModal({ visible, onClose, onConfirm }: DateTimePickerModalProps) {
  
  // Pick default initial values
  const [m, setM] = useState(MONTHS[9]); // Oct
  const [d, setD] = useState(DAYS[14]);  // 15th
  const [y, setY] = useState(YEARS[0]);  // 2023
  const [h, setH] = useState(HOURS[9]);  // 10:00
  const [min, setMin] = useState(MINS[0]);
  const [p, setP] = useState(PERIODS[0]);

  const handleConfirm = () => {
    onConfirm(`${m} ${d}, ${y}, ${h}:${min} ${p}`);
    onClose();
  };

  const PickerColumn = ({ data, selectedValue, onSelect, label }: any) => (
    <View className="flex-1 items-center gap-1.5 h-64 border-r border-gray-100 last:border-r-0">
      <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">{label}</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
        {data.map((item: any) => {
          const isSelected = selectedValue === item;
          return (
            <TouchableOpacity key={item} onPress={() => onSelect(item)} className={`py-2 px-1 rounded-full ${isSelected ? 'bg-blue-600' : ''}`}>
              <Text className={`text-base ${isSelected ? 'font-bold text-white' : 'text-gray-800'}`}>
                {item}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl pb-10">
          
          <View className="flex-row items-center justify-between p-6 border-b border-gray-100">
            <Text className="text-xl font-bold text-black">Select Date & Time</Text>
            <TouchableOpacity onPress={onClose} className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
              <X size={18} color="#374151" />
            </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center p-4">
            <PickerColumn data={MONTHS} selectedValue={m} onSelect={setM} label="Month" />
            <PickerColumn data={DAYS} selectedValue={d} onSelect={setD} label="Day" />
            <PickerColumn data={YEARS} selectedValue={y} onSelect={setY} label="Year" />
            <View className="w-[1px] h-32 bg-gray-100 mx-2" />
            <PickerColumn data={HOURS} selectedValue={h} onSelect={setH} label="Hr" />
            <PickerColumn data={MINS} selectedValue={min} onSelect={setMin} label="Min" />
            <PickerColumn data={PERIODS} selectedValue={p} onSelect={setP} label="Period" />
          </View>
          
          <View className="p-6">
            <TouchableOpacity onPress={handleConfirm} className="bg-blue-600 p-4 rounded-2xl items-center justify-center">
              <Text className="text-white font-bold text-base">Confirm Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}