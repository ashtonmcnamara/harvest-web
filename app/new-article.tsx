import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function CreateArticleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

const handleSave = async () => {
    if (!title || !url) {
      Alert.alert('Missing Info', 'Please provide both a title and a link.');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      Alert.alert('Invalid URL', 'Please make sure the link starts with https://');
      return;
    }

    setLoading(true);

    try {
      // 1. Get the session first!
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error("You must be logged in.");

      // 2. Pass the author_id to the database
      const { error } = await supabase
        .from('articles')
        .insert([{ title, url, author_id: session.user.id }]);

      if (error) throw error;

      Alert.alert('Published', 'The featured article is now live on the Explore feed.', [
        { text: 'Awesome', onPress: () => router.replace('/(tabs)/') }
      ]);
    } catch (error: any) {
      Alert.alert('Error Publishing', error.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/')} className="w-10 h-10 -ml-2 items-center justify-center">
          <X size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black">Add Article</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} className="w-16 -mr-2 items-center justify-center">
          {loading ? <ActivityIndicator color="#1d4ed8" /> : <Text className="text-[#1d4ed8] font-bold text-lg">Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-6 gap-6">
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