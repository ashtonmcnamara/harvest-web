import React, { useState, useCallback, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Modal, Alert, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Plus, ChevronDown, ChevronUp, Trash2, ArrowUp, ArrowDown, ArrowLeft, Search, SlidersHorizontal, ChevronRight } from 'lucide-react-native';
import FarmFilterModal from '@/components/home/FarmFilterModal';
import { supabase } from '@/lib/supabase';

export default function PantryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [searchQuery, setSearchQuery] = useState('');
  const [farmFilters, setFarmFilters] = useState<any>({ products: [], business: [], counties: [], hasPickup: false, hasDelivery: false, marketsOnly: false });

  const [pantryItems, setPantryItems] = useState<any[]>([]);
  const [allFarms, setAllFarms] = useState<any[]>([]);
  
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    'Fruits & Veggies': true, 'Dairy & Eggs': true, 'Wine & Beer': true, 'Meat & Poultry': true, 'Other': true
  });

  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      setLoading(true);

      async function loadPantryData() {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) return;

          const { data: pantryData } = await supabase.from('user_pantry').select('id, products(*, farms(id, name, avatar_url))').eq('user_id', session.user.id);
          if (pantryData) {
            const formattedPantry = pantryData.map((p: any) => {
              const prod = p.products;
              const farm = prod.farms;
              return { id: p.id, farmId: farm?.id, farmLogo: farm?.avatar_url, farmName: farm?.name || 'Unknown Farm', productName: prod.name, productImage: prod.image_url, category: prod.category || 'Other' };
            });
            setPantryItems(formattedPantry);
          }

          const { data: farmsData } = await supabase.from('farms').select('*, products(category)');
          if (farmsData) {
            const mappedFarms = farmsData.map(f => {
              const tags = Array.from(new Set((f.products || []).map((p: any) => p.category).filter(Boolean)));
              return { ...f, tags, businessType: f.business_type, hasPickup: f.has_pickup, hasDelivery: f.has_delivery, marketsOnly: f.markets_only };
            });
            setAllFarms(mappedFarms);
          }
        } catch (error) {
          console.error("Error loading pantry:", error);
        } finally {
          setLoading(false);
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        }
      }
      loadPantryData();
    }, [fadeAnim])
  );

  const toggleCategory = (category: string) => setExpandedCats(prev => ({ ...prev, [category]: !prev[category] }));

  const removeItem = async (pantryId: string) => {
    setPantryItems(prev => prev.filter(item => item.id !== pantryId));
    try { await supabase.from('user_pantry').delete().eq('id', pantryId); } catch (error) {}
  };

  const groupedPantry = pantryItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const moveItem = (category: string, index: number, direction: 'up' | 'down') => {
    const catItems = groupedPantry[category];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === catItems.length - 1) return;

    const newItems = [...pantryItems];
    const globalIdx1 = newItems.findIndex(i => i.id === catItems[index].id);
    const globalIdx2 = newItems.findIndex(i => i.id === catItems[direction === 'up' ? index - 1 : index + 1].id);

    const temp = newItems[globalIdx1];
    newItems[globalIdx1] = newItems[globalIdx2];
    newItems[globalIdx2] = temp;
    setPantryItems(newItems);
  };

  const displayedFarms = allFarms.filter(farm => {
    if (searchQuery && !farm.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (farmFilters.products.length > 0 && !farm.tags.some((t: string) => farmFilters.products.includes(t))) return false;
    if (farmFilters.business.length > 0 && !farmFilters.business.includes(farm.businessType)) return false;
    if (farmFilters.counties.length > 0 && !farmFilters.counties.includes(farm.county)) return false;
    if (farmFilters.hasPickup && !farm.hasPickup) return false;
    if (farmFilters.hasDelivery && !farm.hasDelivery) return false;
    if (farmFilters.marketsOnly && !farm.marketsOnly) return false;
    return true;
  });

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100 bg-white" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} className="min-w-[80px]">
          <Text className="text-[#1d4ed8] font-bold text-lg">{isEditing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black">My Pantry</Text>
        <View className="min-w-[80px] items-end">
          <TouchableOpacity onPress={() => setShowAddModal(true)} className="w-10 h-10 bg-[#eff6ff] rounded-full items-center justify-center border border-blue-100 shadow-sm">
            <Plus size={20} color="#1d4ed8" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="h-64" />
        ) : (
          <Animated.View style={{ opacity: fadeAnim }} className="gap-4 pb-10">
            {Object.keys(groupedPantry).length === 0 && <Text className="text-gray-500 text-center mt-10">Your pantry is empty! Tap the + button to add products.</Text>}
            {Object.keys(groupedPantry).map(category => {
              const items = groupedPantry[category];
              const isExpanded = expandedCats[category] !== false; 

              return (
                <View key={category} className="bg-white border border-gray-200/80 rounded-3xl overflow-hidden shadow-sm shadow-gray-200/40">
                  <TouchableOpacity activeOpacity={0.7} onPress={() => toggleCategory(category)} className={`flex-row items-center justify-between p-4 ${isExpanded ? 'border-b border-gray-100' : ''}`}>
                    <Text className="text-lg font-bold text-black">{category}</Text>
                    <View className="flex-row items-center gap-3">
                      <View className="bg-[#eff6ff] px-2.5 py-0.5 rounded-full"><Text className="text-[#1d4ed8] font-bold text-sm">{items.length}</Text></View>
                      {isExpanded ? <ChevronUp size={20} color="#6b7280" /> : <ChevronDown size={20} color="#6b7280" />}
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View>
                      {items.map((item, index) => (
                        <View key={item.id} className={`flex-row items-center p-4 ${index !== items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                          <TouchableOpacity onPress={() => item.farmId ? router.push(`/pantry-add/${item.farmId}`) : null} className="flex-row flex-1 items-center" activeOpacity={0.7}>
                            <View className="w-12 h-12 bg-gray-100 rounded-full mr-4 overflow-hidden border border-gray-200 items-center justify-center">
                              {item.farmLogo ? <Image source={{ uri: item.farmLogo }} className="w-full h-full" /> : <Text>🚜</Text>}
                            </View>
                            <View className="flex-1 pr-4">
                              <Text className="text-base font-bold text-black mb-0.5">{item.farmName}</Text>
                              <Text className="text-sm text-gray-500">{item.productImage} {item.productName}</Text>
                            </View>
                          </TouchableOpacity>
                          
                          {isEditing && (
                            <View className="flex-row items-center gap-2 bg-[#F9FAFB] border border-gray-200 p-1.5 rounded-xl shadow-xs ml-2">
                              <TouchableOpacity onPress={() => moveItem(category, index, 'up')} disabled={index === 0} className="p-1"><ArrowUp size={20} color={index === 0 ? "#d1d5db" : "#1d4ed8"} /></TouchableOpacity>
                              <TouchableOpacity onPress={() => moveItem(category, index, 'down')} disabled={index === items.length - 1} className="p-1"><ArrowDown size={20} color={index === items.length - 1 ? "#d1d5db" : "#1d4ed8"} /></TouchableOpacity>
                              <View className="w-[1px] h-6 bg-gray-200 mx-1" />
                              <TouchableOpacity onPress={() => removeItem(item.id)} className="p-1"><Trash2 size={20} color="#ef4444" /></TouchableOpacity>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </Animated.View>
        )}
      </ScrollView>

      {/* Find Producers Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View className="flex-1 bg-[#F9FAFB]">
          <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100 bg-white" style={{ paddingTop: Math.max(insets.top, 16) }}>
            <TouchableOpacity onPress={() => setShowAddModal(false)} className="w-10 h-10 items-center justify-center -ml-2"><ArrowLeft size={24} color="#333" /></TouchableOpacity>
            <Text className="text-xl font-bold text-black">Find Producers</Text>
            <TouchableOpacity onPress={() => setShowFilters(true)} className="w-10 h-10 bg-[#eff6ff] rounded-full items-center justify-center border border-blue-100 shadow-sm"><SlidersHorizontal size={18} color="#1d4ed8" /></TouchableOpacity>
          </View>
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="p-5">
              <View className="relative h-12 mb-6">
                <View className="absolute left-4 top-0 bottom-0 justify-center z-10"><Search size={20} color="#888" /></View>
                <Input placeholder="Search farms & products..." value={searchQuery} onChangeText={setSearchQuery} className="pl-12 pr-4 rounded-full border border-gray-200 bg-white h-full text-black" placeholderTextColor="#9CA3AF" />
              </View>
              {displayedFarms.length === 0 && <Text className="text-gray-500 text-center mt-8 font-medium">No farms match your search.</Text>}
              <View className="gap-4 pb-10">
                {displayedFarms.map(farm => (
                  <TouchableOpacity 
                    key={farm.id} activeOpacity={0.9}
                    onPress={() => {
                      if (!farm.products || farm.products.length === 0) Alert.alert('No Products', `${farm.name} hasn't added any products yet. Check back soon!`);
                      else { router.push(`/pantry-add/${farm.id}`); setTimeout(() => setShowAddModal(false), 500); }
                    }}
                    className="bg-white border border-gray-100 rounded-3xl p-4 flex-row items-center shadow-md shadow-gray-200/30"
                  >
                    <View className="w-16 h-16 bg-gray-100 rounded-2xl mr-4 overflow-hidden border border-gray-200 items-center justify-center">
                       {farm.avatar_url ? <Image source={{ uri: farm.avatar_url }} className="w-full h-full bg-gray-200" /> : <Text>🚜</Text>}
                    </View>
                    <View className="flex-1 pr-4">
                      <Text className="text-lg font-bold text-black mb-1">{farm.name}</Text>
                      <Text className="text-sm font-medium text-[#1d4ed8]" numberOfLines={2}>{farm.location_address || 'Nova Scotia'}</Text>
                    </View>
                    <ChevronRight size={20} color="#9ca3af" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
        <FarmFilterModal visible={showFilters} onClose={() => setShowFilters(false)} onApply={(f: any) => { setFarmFilters(f); setShowFilters(false); }} currentFilters={farmFilters} />
      </Modal>
    </View>
  );
}