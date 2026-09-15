import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { X, Image as ImageIcon, Plus, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

export default function CreateUpdateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { userMode } = useAuth();
  const isAdmin = userMode === 'admin';
  
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [farmName, setFarmName] = useState<string | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [fetchingFarms, setFetchingFarms] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      setFetchingFarms(false);
      return;
    }

    async function loadFarm() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      
      const { data: myFarmData } = await supabase.from('farm_members').select('farm_id, farms(name)').eq('user_id', session.user.id).single();
      
      if (myFarmData) {
        setSelectedFarmId(myFarmData.farm_id);
        setFarmName(myFarmData.farms?.name || 'Your Farm');
      }
      setFetchingFarms(false);
    }
    loadFarm();
  }, [isAdmin]);

  const triggerPhotoAction = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setUploading(true);
        const base64File = result.assets[0].base64;
        const ext = result.assets[0].uri.split('.').pop()?.toLowerCase() || 'jpeg';
        const fileName = `update_${Date.now()}.${ext}`;

        const { error } = await supabase.storage.from('harvest').upload(fileName, decode(base64File), { contentType: `image/${ext}` });
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from('harvest').getPublicUrl(fileName);
        setImageUrl(publicUrl);
      }
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveUpdate = async () => {
    if (!content.trim()) {
      Alert.alert('Missing Info', 'Please write something for your update!');
      return;
    }

    if (!isAdmin && !selectedFarmId) {
      Alert.alert('No Farm Found', 'You must create a farm profile before you can post an update.');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('You must be logged in to post an update.');

      // Because we fetch updates via farm_members in HomeFeed, just assigning author_id triggers the correct Farm logic!
      const { error } = await supabase.from('updates').insert([{
        content: content,
        image_url: imageUrl,
        author_id: session.user.id
      }]);

      if (error) throw error;

      Alert.alert('Posted!', 'Your update has been published to the live feed.', [{ text: 'Great', onPress: () => router.replace('/(tabs)/') }]);
    } catch (error: any) {
      Alert.alert('Error Posting', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/')} className="w-10 h-10 -ml-2 items-center justify-center">
          <X size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black">Create Update</Text>
        <TouchableOpacity onPress={handleSaveUpdate} disabled={loading || uploading || fetchingFarms} className="w-16 -mr-2 items-center justify-center">
          {loading ? <ActivityIndicator color="#1d4ed8" /> : <Text className="text-[#1d4ed8] font-bold text-lg">Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
         <View className="gap-6 pt-6 pb-20">
            {isAdmin ? (
               <View className="bg-purple-50 border border-purple-100 p-3 rounded-xl">
                 <Text className="text-purple-800 text-sm font-medium">Posting as: <Text className="font-bold">HarvestNS Admin</Text></Text>
               </View>
            ) : (
               !fetchingFarms && farmName && (
                 <View className="bg-blue-50 border border-blue-100 p-3 rounded-xl">
                   <Text className="text-blue-800 text-sm font-medium">Posting as: <Text className="font-bold">{farmName}</Text></Text>
                 </View>
               )
            )}

            <View className="gap-2.5">
               <Text className="text-base font-bold text-black">Update Content</Text>
               <TextInput 
                  placeholder={isAdmin ? "Broadcast a message to all users..." : "What's new at the farm?"}
                  multiline numberOfLines={10} textAlignVertical="top"
                  className="rounded-2xl border border-gray-200 bg-[#F9FAFB] text-black p-5 h-48 leading-6 text-base" 
                  value={content} onChangeText={setContent}
               />
            </View>

            {imageUrl ? (
              <View className="relative">
                <Image source={{ uri: imageUrl }} className="w-full h-48 rounded-2xl border border-gray-200" />
                <TouchableOpacity onPress={() => setImageUrl(null)} className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full items-center justify-center">
                  <Trash2 size={16} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={triggerPhotoAction} disabled={uploading} className="flex-row items-center bg-[#eff6ff] border border-blue-100 rounded-full px-5 py-4 gap-3 border-dashed">
                 {uploading ? <ActivityIndicator color="#1d4ed8" /> : <ImageIcon size={20} color="#1d4ed8" />}
                 <Text className="flex-1 text-base font-bold text-[#1d4ed8]">{uploading ? 'Uploading...' : 'Add Photo'}</Text>
                 {!uploading && <Plus size={18} color="#1d4ed8" />}
              </TouchableOpacity>
            )}

         </View>
      </ScrollView>
    </View>
  );
}