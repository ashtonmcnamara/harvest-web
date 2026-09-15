import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { X, ChevronDown, Check } from 'lucide-react-native';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (products: string[], business: string[]) => void;
  currentProducts?: string[];
  currentBusiness?: string[];
}

// Aligned with the exact categories used in the DB!
const PRODUCT_TYPES = [
  'Fruits & Veggies', 'Meat & Poultry', 'Dairy & Eggs', 'Wine & Beer', 'Jams & Jellies', 'Grain & Legumes'
];

const BUSINESS_TYPES = ['Artisan', 'Family-size', 'Mid-large size'];

// Added default empty arrays to the props to prevent the "undefined" crash!
export default function FilterModal({ 
  visible, 
  onClose, 
  onApply, 
  currentProducts = [], 
  currentBusiness = [] 
}: FilterModalProps) {
  const insets = useSafeAreaInsets();
  
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string[]>([]);

  // Sync state safely when the modal opens
  useEffect(() => {
    if (visible) {
      setSelectedProducts(currentProducts || []);
      setSelectedBusiness(currentBusiness || []);
    }
  }, [visible, currentProducts, currentBusiness]);

  const toggleProduct = (product: string) => {
    setSelectedProducts(prev => 
      prev.includes(product) ? prev.filter(p => p !== product) : [...prev, product]
    );
  };

  const toggleBusiness = (type: string) => {
    setSelectedBusiness(prev => 
      prev.includes(type) ? prev.filter(b => b !== type) : [...prev, type]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        
        <View className="flex-row items-center justify-between px-4 pb-4 border-b border-gray-100">
          <TouchableOpacity onPress={onClose} className="p-2 -ml-2">
            <X size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-black">Filters</Text>
          <TouchableOpacity onPress={() => onApply(selectedProducts, selectedBusiness)} className="p-2 -mr-2">
            <Text className="text-[#1d4ed8] font-semibold text-base">Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          
          <Text className="text-lg font-bold mt-6 mb-4 text-black">Product Type</Text>
          <View className="flex-row flex-wrap gap-2.5">
            {PRODUCT_TYPES.map(product => {
              const isSelected = selectedProducts.includes(product);
              return (
                <TouchableOpacity
                  key={product}
                  onPress={() => toggleProduct(product)}
                  className={`px-4 py-2 rounded-full border ${
                    isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <Text className={`text-sm ${isSelected ? 'font-bold text-blue-700' : 'text-gray-700 font-medium'}`}>
                    {product}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text className="text-lg font-bold mt-8 mb-4 text-black">Location</Text>
          <TouchableOpacity className="flex-row items-center justify-between border border-gray-200 rounded-2xl px-4 py-3.5 bg-[#F9FAFB]">
            <Text className="text-base text-black font-medium">Near me</Text>
            <ChevronDown size={20} color="#333" />
          </TouchableOpacity>

          <Text className="text-lg font-bold mt-8 mb-4 text-black">Business Type</Text>
          <View className="gap-3 mb-10">
            {BUSINESS_TYPES.map(type => {
              const isSelected = selectedBusiness.includes(type);
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => toggleBusiness(type)}
                  className="flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-[#F9FAFB] gap-4"
                >
                  <View className={`w-6 h-6 rounded-md items-center justify-center ${
                    isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border border-gray-300'
                  }`}>
                    {isSelected && <Check size={16} color="white" />}
                  </View>
                  <Text className="text-base font-medium text-black">{type}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

        </ScrollView>
      </View>
    </Modal>
  );
}