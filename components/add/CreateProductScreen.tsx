import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { X, ChevronDown } from 'lucide-react-native';
import RNPickerSelect from 'react-native-picker-select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/context/AuthContext';

const PRODUCT_CATEGORIES = [
  { label: 'Fruits & Veggies', value: 'Fruits & Veggies' },
  { label: 'Meat & Poultry', value: 'Meat & Poultry' },
  { label: 'Dairy & Eggs', value: 'Dairy & Eggs' },
  { label: 'Wine & Beer', value: 'Wine & Beer' },
  { label: 'Jams & Jellies', value: 'Jams & Jellies' },
  { label: 'Grain & Legumes', value: 'Grain & Legumes' }
];

const UNIT_ITEMS = [
  { label: 'lb', value: 'lb' },
  { label: 'g', value: 'g' },
  { label: 'kg', value: 'kg' },
  { label: 'btl', value: 'btl' },
  { label: 'dozen', value: 'dozen' },
  { label: 'piece', value: 'piece' },
  { label: 'jar', value: 'jar' }
];

export default function CreateProductScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userMode } = useAuth();
  
  const [productName, setProductName] = useState('');
  const [servingSizeNum, setServingSizeNum] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(UNIT_ITEMS[0].value); 
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0].value); 
  const [productEmoji, setProductEmoji] = useState('🍎');
  const [loading, setLoading] = useState(false);

  const [availableFarms, setAvailableFarms] = useState<any[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [fetchingFarms, setFetchingFarms] = useState(true);

useEffect(() => {
    async function loadFarms() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      let query = supabase.from('farms').select('id, name');
      
      // If they are not an admin, strictly filter to their owned farms
      if (userMode !== 'admin') {
        query = supabase
          .from('farms')
          .select('id, name, farm_members!inner(user_id)')
          .eq('farm_members.user_id', session.user.id);
      }

      const { data, error } = await query;

      if (data && data.length > 0) {
        setAvailableFarms(data);
        setSelectedFarmId(data[0].id);
      }
      setFetchingFarms(false);
    }
    loadFarms();
  }, [userMode]);

  const handleSaveProduct = async () => {
    if (!productName) {
      Alert.alert('Missing Info', 'Please enter a product name!');
      return;
    }

    if (!selectedFarmId) {
      Alert.alert('No Farm Found', 'You must create a farm profile before adding products.');
      return;
    }

    setLoading(true);

    try {
      const finalPriceString = servingSizeNum ? `${servingSizeNum} ${selectedUnit}` : `1 ${selectedUnit}`;

      const { error } = await supabase
        .from('products')
        .insert([
          {
            name: productName,
            category: category,
            price: finalPriceString,
            image_url: productEmoji || '🍎',
            description: productDetails || 'Locally produced with care.',
            farm_id: selectedFarmId
          }
        ]);

      if (error) throw error;

      Alert.alert('Success!', 'Your product has been added to your farm.', [
        { text: 'Awesome', onPress: () => router.back('/(tabs)/') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100" style={{ paddingTop: Math.max(insets.top, 16) }}>
<TouchableOpacity onPress={() => router.back()} className="w-10 h-10 -ml-2 items-center justify-center">
  <X size={24} color="#000" />
</TouchableOpacity>
        <Text className="text-xl font-bold text-black">Add Product</Text>
        <TouchableOpacity onPress={handleSaveProduct} disabled={loading || fetchingFarms} className="w-16 -mr-2 items-center justify-center">
          {loading ? <ActivityIndicator color="#1d4ed8" /> : <Text className="text-[#1d4ed8] font-bold text-lg">Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="p-6 gap-6">
{/* Farm Selector Dropdown */}
          {!fetchingFarms && availableFarms.length > 0 && (
            <View className="gap-2.5 -mt-2">
              <Text className="text-base font-bold text-black">Select Farm</Text>
              <RNPickerSelect 
                onValueChange={(value) => setSelectedFarmId(value)} 
                items={availableFarms.map(f => ({ label: f.name, value: f.id }))} 
                value={selectedFarmId}
              >
                <View className="flex-row items-center justify-between border border-blue-200 rounded-xl px-4 h-12 bg-blue-50">
                  <Text className="text-base font-bold text-blue-800">
                    {availableFarms.find(f => f.id === selectedFarmId)?.name || 'Select a farm...'}
                  </Text>
                  <ChevronDown size={20} color="#1e40af" />
                </View>
              </RNPickerSelect>
            </View>
          )}

          <View className="flex-row items-start gap-5">
            <View className="w-16 gap-2.5">
              <Text className="text-base font-bold text-black text-center">Emoji</Text>
              <Input 
                maxLength={2}
                className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black h-12 text-center text-xl" 
                value={productEmoji}
                onChangeText={setProductEmoji}
              />
            </View>
            <View className="flex-1 gap-2.5">
              <Text className="text-base font-bold text-black">Name</Text>
              <Input 
                placeholder="Product name..." 
                className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black h-12" 
                placeholderTextColor="#9CA3AF"
                value={productName}
                onChangeText={setProductName}
              />
            </View>
          </View>

          <View className="gap-2.5">
            <Text className="text-base font-bold text-black">Category</Text>
            <RNPickerSelect onValueChange={(value) => setCategory(value)} items={PRODUCT_CATEGORIES} value={category}>
              <View className="flex-row items-center justify-between border border-gray-200 rounded-xl px-4 h-12 bg-[#F9FAFB]">
                <Text className="text-base text-gray-800">{category}</Text>
                <ChevronDown size={20} color="#333" />
              </View>
            </RNPickerSelect>
          </View>

          <View className="gap-2.5">
            <Text className="text-base font-bold text-black">Serving Size / Weight</Text>
            <View className="flex-row items-center gap-3">
              <View className="flex-1 relative justify-center">
                <Text className="text-xs text-gray-400 absolute top-2 right-4 font-bold uppercase"># only</Text>
                <Input 
                  placeholder="e.g. 1 or 500..." 
                  keyboardType="numeric" 
                  className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black h-12" 
                  placeholderTextColor="#9CA3AF"
                  value={servingSizeNum}
                  onChangeText={setServingSizeNum}
                />
              </View>
              
              <View className="w-24 h-12">
                <RNPickerSelect onValueChange={(value) => setSelectedUnit(value)} items={UNIT_ITEMS} value={selectedUnit}>
                  <View className="w-full h-full flex-row items-center justify-center bg-gray-100 rounded-xl border border-gray-200 gap-1">
                    <Text className="text-base font-bold text-gray-800">{selectedUnit}</Text>
                    <ChevronDown size={14} color="#6b7280" />
                  </View>
                </RNPickerSelect>
              </View>
            </View>
          </View>

          <View className="gap-2.5">
            <Text className="text-base font-bold text-black">Details</Text>
            <TextInput 
              placeholder="Product details..." 
              multiline 
              numberOfLines={6}
              textAlignVertical="top"
              className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black p-4 h-32 leading-6" 
              placeholderTextColor="#9CA3AF"
              value={productDetails}
              onChangeText={setProductDetails}
            />
          </View>

        </View>
      </ScrollView>
    </View>
  );
}