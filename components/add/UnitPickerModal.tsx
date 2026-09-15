import React from 'react';
import { View, TouchableOpacity, Modal } from 'react-native';
import { Text } from '@/components/ui/text';
import { X, Check } from 'lucide-react-native';

interface UnitPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (unit: string) => void;
  selectedUnit: string;
}

const UNITS = ['lb', 'g', 'kg', 'btl', 'dozen', 'piece', 'jar'];

export default function UnitPickerModal({ visible, onClose, onSelect, selectedUnit }: UnitPickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} className="flex-1 justify-center bg-black/60 px-6">
        <TouchableOpacity activeOpacity={1} className="bg-white rounded-3xl overflow-hidden p-6 gap-2">
          
          <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <Text className="text-lg font-bold text-black">Select Unit</Text>
            <TouchableOpacity onPress={onClose} className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
              <X size={18} color="#374151" />
            </TouchableOpacity>
          </View>
          
          <View className="gap-2">
            {UNITS.map(unit => {
              const isSelected = selectedUnit === unit;
              return (
                <TouchableOpacity 
                  key={unit}
                  onPress={() => { onSelect(unit); onClose(); }} 
                  className={`flex-row items-center justify-between p-4 rounded-xl ${isSelected ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-100'}`}
                >
                  <Text className={`text-base ${isSelected ? 'font-semibold text-blue-700' : 'text-gray-800'}`}>
                    {unit}
                  </Text>
                  {isSelected && <Check size={20} color="#1d4ed8" />}
                </TouchableOpacity>
              )
            })}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}