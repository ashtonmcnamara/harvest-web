import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { X, Check } from 'lucide-react-native';

const PRODUCT_TYPES = ['Fruits & Veggies', 'Meat & Poultry', 'Dairy & Eggs', 'Wine & Beer', 'Jams & Jellies', 'Grain & Legumes'];
const BUSINESS_TYPES = ['Artisan', 'Family-size', 'Mid-large size'];
const COUNTIES = ['Halifax', 'Kings', 'Annapolis', 'Lunenburg', 'Pictou', 'Hants'];

export default function FarmFilterModal({ visible, onClose, onApply, currentFilters }: any) {
  const insets = useSafeAreaInsets();
  
  const [products, setProducts] = useState<string[]>([]);
  const [business, setBusiness] = useState<string[]>([]);
  const [counties, setCounties] = useState<string[]>([]);
  const [hasPickup, setHasPickup] = useState(false);
  const [hasDelivery, setHasDelivery] = useState(false);
  const [marketsOnly, setMarketsOnly] = useState(false);

  useEffect(() => {
    if (visible && currentFilters) {
      setProducts(currentFilters.products || []);
      setBusiness(currentFilters.business || []);
      setCounties(currentFilters.counties || []);
      setHasPickup(currentFilters.hasPickup || false);
      setHasDelivery(currentFilters.hasDelivery || false);
      setMarketsOnly(currentFilters.marketsOnly || false);
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

  const Checkbox = ({ label, value, onToggle }: any) => (
    <TouchableOpacity onPress={onToggle} className="flex-row items-center gap-3 py-3 border-b border-gray-50">
      <View className={`w-6 h-6 rounded border items-center justify-center ${value ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
         {value && <Check size={16} color="white" />}
      </View>
      <Text className="text-base font-medium text-black">{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        
        <View className="flex-row items-center justify-between px-4 pb-4 border-b border-gray-100">
          <TouchableOpacity onPress={onClose} className="p-2 -ml-2"><X size={24} color="#333" /></TouchableOpacity>
          <Text className="text-xl font-bold text-black">Filter Farms</Text>
          <TouchableOpacity onPress={() => onApply({ products, business, counties, hasPickup, hasDelivery, marketsOnly })} className="p-2 -mr-2">
            <Text className="text-[#1d4ed8] font-semibold text-base">Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          
          <Text className="text-lg font-bold mt-6 mb-4 text-black">Product Type</Text>
          <View className="flex-row flex-wrap gap-2.5">
            {PRODUCT_TYPES.map(p => <Pill key={p} label={p} isSelected={products.includes(p)} onPress={() => toggleArrayItem(setProducts, p)} />)}
          </View>

          <Text className="text-lg font-bold mt-8 mb-4 text-black">County</Text>
          <View className="flex-row flex-wrap gap-2.5">
            {COUNTIES.map(c => <Pill key={c} label={c} isSelected={counties.includes(c)} onPress={() => toggleArrayItem(setCounties, c)} />)}
          </View>

          <Text className="text-lg font-bold mt-8 mb-4 text-black">Business Type</Text>
          <View className="flex-row flex-wrap gap-2.5">
            {BUSINESS_TYPES.map(b => <Pill key={b} label={b} isSelected={business.includes(b)} onPress={() => toggleArrayItem(setBusiness, b)} />)}
          </View>

          <Text className="text-lg font-bold mt-8 mb-2 text-black">Purchasing Options</Text>
          <View className="mb-10">
            <Checkbox label="Offers On-Farm Pickup" value={hasPickup} onToggle={() => setHasPickup(!hasPickup)} />
            <Checkbox label="Offers Local Delivery" value={hasDelivery} onToggle={() => setHasDelivery(!hasDelivery)} />
            <Checkbox label="Farmers Markets Only (No Farm Access)" value={marketsOnly} onToggle={() => setMarketsOnly(!marketsOnly)} />
          </View>

        </ScrollView>
      </View>
    </Modal>
  );
}