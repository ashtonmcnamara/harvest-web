import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { ChevronLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function EditArticleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Gets the article ID from the route path (e.g. /edit-article/123)
  const { id } = useLocalSearchParams();
  
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadArticle() {
      if (!id) return;
      try {
        const { data, error } = await supabase.from('articles').select('*').eq('id', id).single();
        if (error) throw error;
        
        if (data) {
          setTitle(data.title || '');
          setUrl(data.url || '');
        }
      } catch (error) {
        Alert.alert("Error", "Could not load article data.");
        router.back();
      } finally {
        setLoading(false);
      }
    }
    loadArticle();
  }, [id]);

  const handleUpdate = async () => {
    if (!title || !url) {
      Alert.alert('Missing Info', 'Please provide both a title and a link.');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      Alert.alert('Invalid URL', 'Please make sure the link starts with https://');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('articles')
        .update({ title, url })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Success', 'The featured article has been updated successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error Updating', error.message);
    } finally {
      setSaving(false);
    }
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
          <ChevronLeft size={28} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black">Edit Article</Text>
        <TouchableOpacity onPress={handleUpdate} disabled={saving} className="w-16 -mr-2 items-center justify-center">
          {saving ? <ActivityIndicator color="#1d4ed8" /> : <Text className="text-[#1d4ed8] font-bold text-lg">Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-6 gap-6" keyboardShouldPersistTaps="handled">
        <View className="gap-2.5">
          <Text className="text-base font-bold text-black">Article Title</Text>
          <Input 
            placeholder="e.g. Sustainable Farming in NS" 
            className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black h-12" 
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View className="gap-2.5">
          <Text className="text-base font-bold text-black">Article Link (URL)</Text>
          <Input 
            placeholder="https://..." 
            autoCapitalize="none"
            className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black h-12" 
            value={url}
            onChangeText={setUrl}
          />
          <Text className="text-sm font-bold text-red-500">MAKE SURE TO ADD https://</Text>
        </View>
      </ScrollView>
    </View>
  );
}