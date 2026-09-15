import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { X, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function EditProductScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Product ID
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      try {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error) throw error;
        
        if (data) {
          setName(data.name || '');
          setCategory(data.category || '');
          setPrice(data.price || '');
          setDescription(data.description || '');
        }
      } catch (error) {
        Alert.alert("Error", "Could not load product data.");
        router.back();
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const handleUpdate = async () => {
    if (!name) {
      Alert.alert('Missing Info', 'Product Name is required.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ name, category, price, description })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Success', 'Product updated successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Update Failed', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('products').delete().eq('id', id);
            router.back();
          } catch (error) {
            console.error("Delete Error:", error);
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 -ml-2 items-center justify-center">
          <X size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black">Edit Product</Text>
        <TouchableOpacity onPress={handleUpdate} disabled={saving} className="w-16 -mr-2 items-center justify-center">
          {saving ? <ActivityIndicator color="#1d4ed8" /> : <Text className="text-[#1d4ed8] font-bold text-lg">Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-6 gap-6" showsVerticalScrollIndicator={false}>
        
        <View className="gap-2.5">
          <Text className="text-base font-bold text-black">Product Name</Text>
          <Input className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black h-12" value={name} onChangeText={setName} />
        </View>

        <View className="gap-2.5">
          <Text className="text-base font-bold text-black">Category</Text>
          <Input className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black h-12" value={category} onChangeText={setCategory} />
        </View>

        <View className="gap-2.5">
          <Text className="text-base font-bold text-black">Price</Text>
          <Input className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black h-12" value={price} onChangeText={setPrice} placeholder="e.g. $5.00 / lb" />
        </View>

        <View className="gap-2.5">
          <Text className="text-base font-bold text-black">Description</Text>
          <TextInput multiline numberOfLines={4} textAlignVertical="top" className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black p-4 h-32 leading-6 text-base" value={description} onChangeText={setDescription} />
        </View>

        <TouchableOpacity onPress={handleDelete} className="flex-row items-center justify-center bg-red-50 border border-red-200 py-4 rounded-xl gap-2 mt-4">
          <Trash2 size={18} color="#dc2626" />
          <Text className="text-red-600 font-bold text-base">Delete Product</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}