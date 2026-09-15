import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ChevronLeft, Plus, Minus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function AddProductsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [activeFarm, setActiveFarm] = useState<any>(null);
  const [farmProducts, setFarmProducts] = useState<any[]>([]);
  const [pantryItemIds, setPantryItemIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFarmAndProducts() {
      if (!id) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;

        // 1. Fetch Farm Info
        const { data: farm } = await supabase.from('farms').select('*').eq('id', id).single();
        if (farm) setActiveFarm(farm);

        // 2. Fetch Farm's Products
        const { data: products } = await supabase.from('products').select('*').eq('farm_id', id);
        if (products) setFarmProducts(products);

        // 3. Fetch User's Pantry to see what they already added from this farm
        const { data: pantryItems } = await supabase
          .from('user_pantry')
          .select('product_id')
          .eq('user_id', session.user.id);
          
        if (pantryItems) {
          setPantryItemIds(new Set(pantryItems.map(p => p.product_id)));
        }

      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    }
    loadFarmAndProducts();
  }, [id]);

  const togglePantryItem = async (product: any) => {
    const isAdded = pantryItemIds.has(product.id);
    
    // 1. Optimistic UI update for a snappy feel
    setPantryItemIds(prev => {
      const newSet = new Set(prev);
      if (isAdded) newSet.delete(product.id);
      else newSet.add(product.id);
      return newSet;
    });

    // 2. Database Sync
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      if (isAdded) {
        await supabase.from('user_pantry')
          .delete()
          .eq('user_id', session.user.id)
          .eq('product_id', product.id);
      } else {
        // We inject a default 'rank_index' string here to satisfy the DB schema
        await supabase.from('user_pantry')
          .insert({ 
            user_id: session.user.id, 
            product_id: product.id, 
            rank_index: '0' 
          });
      }
    } catch (error) {
      console.error("Error toggling pantry item:", error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F9FAFB]">
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      {/* Header */}
      <View className="flex-row items-center px-5 pb-4 border-b border-gray-100 bg-white" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2">
          <ChevronLeft size={28} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black ml-2">{activeFarm?.name || 'Farm Products'}</Text>
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        <Text className="text-xl font-bold text-black mb-6">Add Offered Products</Text>

        <View className="gap-4 pb-10">
          {farmProducts.map((product: any) => {
            const isAdded = pantryItemIds.has(product.id);

            return (
              <View 
                key={product.id} 
                className={`flex-row items-center p-4 rounded-2xl border shadow-sm ${
                  isAdded ? 'bg-[#F3F4F6] border-gray-200' : 'bg-white border-gray-100'
                }`}
              >
                <Text className="text-2xl mr-4">{product.image_url}</Text>
                
                <View className="flex-1 pr-4">
                  <Text className="text-base font-bold text-black mb-0.5">{product.name}</Text>
                  <Text className="text-sm text-gray-500">{product.category}</Text>
                </View>

                <TouchableOpacity 
                  onPress={() => togglePantryItem(product)}
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    isAdded ? 'border border-[#ef4444] bg-transparent' : 'bg-[#003d99]'
                  }`}
                >
                  {isAdded ? (
                    <Minus size={16} color="#ef4444" />
                  ) : (
                    <Plus size={16} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {farmProducts.length === 0 && (
          <Text className="text-gray-500 italic text-center mt-4">This farm has not listed any products yet.</Text>
        )}
      </ScrollView>
    </View>
  );
}