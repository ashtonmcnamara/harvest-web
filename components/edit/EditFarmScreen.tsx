import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { X, Image as ImageIcon, MapPin, Check, ChevronDown } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

export default function EditFarmScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams(); 
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [farmName, setFarmName] = useState('');
  const [farmSlug, setFarmSlug] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [farmBio, setFarmBio] = useState('');
  
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [farmHours, setFarmHours] = useState('');
  const [farmDelivery, setFarmDelivery] = useState('');
  const [farmTours, setFarmTours] = useState('');
  const [farmCertificates, setFarmCertificates] = useState('');

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [county, setCounty] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [hasPickup, setHasPickup] = useState(false);
  const [hasDelivery, setHasDelivery] = useState(false);
  const [marketsOnly, setMarketsOnly] = useState(false);

  // NEW LINKS
  const [websiteLink, setWebsiteLink] = useState('');
  const [socialPlatform, setSocialPlatform] = useState('Instagram');
  const [socialLink, setSocialLink] = useState('');
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);

  useEffect(() => {
    async function loadFarm() {
      if (!id) return;
      try {
        const { data, error } = await supabase.from('farms').select('*').eq('id', id).single();
        if (error) throw error;
        
        if (data) {
          setFarmName(data.name || '');
          setFarmSlug(data.slug || '');
          setFarmLocation(data.location_address || '');
          setFarmBio(data.bio || '');
          setFarmHours(data.hours || '');
          setFarmDelivery(data.delivery_info || '');
          setFarmTours(data.farm_tours || '');
          setFarmCertificates(data.certificates || '');
          setCoverUrl(data.cover_image_url || null);
          setLogoUrl(data.avatar_url || null);
          setLat(data.latitude || null);
          setLng(data.longitude || null);
          setCounty(data.county || '');
          setBusinessType(data.business_type || '');
          setHasPickup(data.has_pickup || false);
          setHasDelivery(data.has_delivery || false);
          setMarketsOnly(data.markets_only || false);
          setWebsiteLink(data.website_link || '');
          setSocialPlatform(data.social_platform || 'Instagram');
          setSocialLink(data.social_link || '');
        }
      } catch (error) {
        Alert.alert("Error", "Could not load farm data.");
        router.back();
      } finally {
        setLoading(false);
      }
    }
    loadFarm();
  }, [id]);

  const handleAddressSearch = async (text: string) => {
    setFarmLocation(text);
    if (text.length > 3) {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=4`);
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (e) {}
    } else {
      setSuggestions([]);
    }
  };

  const pickImage = async (type: 'cover' | 'logo') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Please allow access to your photos to upload an image.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: type === 'cover' ? [16, 9] : [1, 1], quality: 0.5, base64: true });
      if (!result.canceled && result.assets[0].base64) {
        setUploading(true);
        const base64File = result.assets[0].base64;
        const ext = result.assets[0].uri.split('.').pop()?.toLowerCase() || 'jpeg';
        const fileName = `farm_${type}_${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('harvest').upload(fileName, decode(base64File), { contentType: `image/${ext}` });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('harvest').getPublicUrl(fileName);
        if (type === 'cover') setCoverUrl(publicUrl);
        else setLogoUrl(publicUrl);
      }
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!farmName || !farmSlug) {
      Alert.alert('Missing Info', 'Farm Name and Handle are required.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('farms').update({
        name: farmName, slug: farmSlug.replace('@', ''), location_address: farmLocation, latitude: lat, longitude: lng, bio: farmBio, hours: farmHours, delivery_info: farmDelivery, farm_tours: farmTours, certificates: farmCertificates, cover_image_url: coverUrl, avatar_url: logoUrl, county: county, business_type: businessType, has_pickup: hasPickup, has_delivery: hasDelivery, markets_only: marketsOnly,
        website_link: websiteLink, social_platform: socialPlatform, social_link: socialLink
      }).eq('id', id);

      if (error) throw error;
      Alert.alert('Success', 'Farm profile updated successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Update Failed', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator size="large" color="#1d4ed8" /></View>;

  const Checkbox = ({ label, value, onToggle }: any) => (
    <TouchableOpacity onPress={onToggle} className="flex-row items-center gap-3 py-2">
      <View className={`w-6 h-6 rounded border items-center justify-center ${value ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>{value && <Check size={16} color="white" />}</View>
      <Text className="text-base text-gray-800">{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 -ml-2 items-center justify-center"><X size={24} color="#000" /></TouchableOpacity>
        <Text className="text-xl font-bold text-black">Edit Farm</Text>
        <TouchableOpacity onPress={handleUpdate} disabled={saving || uploading} className="w-16 -mr-2 items-center justify-center">
          {saving ? <ActivityIndicator color="#1d4ed8" /> : <Text className="text-[#1d4ed8] font-bold text-lg">Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-6 gap-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="flex-row gap-4 mb-2">
          <TouchableOpacity onPress={() => pickImage('cover')} className="flex-1 h-32 bg-[#eff6ff] rounded-2xl border-2 border-blue-100 border-dashed items-center justify-center overflow-hidden">
            {coverUrl ? <Image source={{ uri: coverUrl }} className="w-full h-full" /> : <><ImageIcon size={28} color="#1d4ed8" /><Text className="text-blue-700 font-bold mt-2 text-xs">Header Image</Text></>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => pickImage('logo')} className="w-32 h-32 bg-[#eff6ff] rounded-2xl border-2 border-blue-100 border-dashed items-center justify-center overflow-hidden">
            {logoUrl ? <Image source={{ uri: logoUrl }} className="w-full h-full" /> : <><ImageIcon size={28} color="#1d4ed8" /><Text className="text-blue-700 font-bold mt-2 text-xs">Logo</Text></>}
          </TouchableOpacity>
        </View>

        <View className="gap-2.5">
          <Text className="text-base font-bold text-black">Farm Name</Text>
          <Input className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black h-12" value={farmName} onChangeText={setFarmName} />
        </View>

        <View className="gap-2.5 z-50">
          <Text className="text-base font-bold text-black">Location (Address)</Text>
          <Input className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black h-12" value={farmLocation} onChangeText={handleAddressSearch} placeholder="Start typing address..." />
          {suggestions.length > 0 && (
            <View className="bg-white border border-gray-200 rounded-xl mt-1 overflow-hidden shadow-sm absolute top-[76px] w-full z-50">
              {suggestions.map((item, idx) => {
                const p = item.properties;
                const fullAddress = `${p.name ? p.name + ', ' : ''}${p.city || p.state}, ${p.country}`;
                return (
                  <TouchableOpacity 
                    key={idx} onPress={() => { setFarmLocation(fullAddress); if (item.geometry && item.geometry.coordinates) { setLng(item.geometry.coordinates[0]); setLat(item.geometry.coordinates[1]); } setSuggestions([]); }}
                    className={`flex-row items-center p-3 ${idx !== suggestions.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <MapPin size={16} color="#6b7280" className="mr-3" />
                    <Text className="text-gray-800 text-sm">{fullAddress}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View className="gap-2.5 -z-10 mt-2">
          <Text className="text-base font-bold text-black">Farm Handle / Slug</Text>
          <Input autoCapitalize="none" className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black h-12" value={farmSlug} onChangeText={setFarmSlug} />
        </View>

        <View className="gap-2.5 -z-10 mt-2 z-40">
          <Text className="text-base font-bold text-black">External Links</Text>
          <Input placeholder="Website URL (https://...)" autoCapitalize="none" className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black h-12 mb-2" value={websiteLink} onChangeText={setWebsiteLink} />
          
          <View className="flex-row gap-2 relative">
            <TouchableOpacity onPress={() => setShowPlatformDropdown(!showPlatformDropdown)} className="w-1/3 flex-row items-center justify-between rounded-xl border border-gray-200 bg-[#F9FAFB] px-3 h-12">
              <Text className="text-black font-medium">{socialPlatform}</Text>
              <ChevronDown size={16} color="#333" />
            </TouchableOpacity>
            
            <Input placeholder="Social URL" autoCapitalize="none" className="flex-1 rounded-xl border border-gray-200 bg-[#F9FAFB] text-black h-12" value={socialLink} onChangeText={setSocialLink} />
            
            {showPlatformDropdown && (
              <View className="absolute top-[52px] left-0 w-1/3 bg-white border border-gray-200 rounded-xl shadow-sm z-50 overflow-hidden">
                {['Instagram', 'Facebook', 'LinkedIn', 'X (Twitter)'].map(p => (
                  <TouchableOpacity key={p} onPress={() => { setSocialPlatform(p); setShowPlatformDropdown(false); }} className="p-3 border-b border-gray-100"><Text>{p}</Text></TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View className="gap-2.5 -z-10">
          <Text className="text-base font-bold text-black">About / Bio</Text>
          <TextInput multiline numberOfLines={4} textAlignVertical="top" className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black p-4 h-32 leading-6 text-base" value={farmBio} onChangeText={setFarmBio} />
        </View>

        <View className="h-[1px] bg-gray-100 my-2 -z-10" />
        <Text className="text-lg font-bold text-black -mb-2 -z-10">Filter Details</Text>
        
        <View className="gap-5 mb-2 -z-10">
          <View className="gap-2.5">
            <Text className="text-sm font-bold text-black">County</Text>
            <Input placeholder="e.g. Kings County" className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black h-12" value={county} onChangeText={setCounty} />
          </View>
          <View>
            <Text className="text-sm font-bold text-black mb-3">Business Type</Text>
            <View className="flex-row flex-wrap gap-2">
              {['Artisan', 'Family-size', 'Mid-large size'].map(type => (
                <TouchableOpacity key={type} onPress={() => setBusinessType(type)} className={`px-4 py-2 rounded-full border ${businessType === type ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                  <Text className={businessType === type ? 'text-blue-700 font-bold' : 'text-gray-600 font-medium'}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="bg-[#F9FAFB] p-4 rounded-xl border border-gray-100 gap-1">
            <Checkbox label="Offers On-Farm Pickup" value={hasPickup} onToggle={() => setHasPickup(!hasPickup)} />
            <Checkbox label="Offers Local Delivery" value={hasDelivery} onToggle={() => setHasDelivery(!hasDelivery)} />
            <Checkbox label="Farmers Markets Only (No Farm Access)" value={marketsOnly} onToggle={() => setMarketsOnly(!marketsOnly)} />
          </View>
        </View>

        <View className="h-[1px] bg-gray-100 my-2 -z-10" />
        <Text className="text-lg font-bold text-black -mb-2 -z-10">Additional Information</Text>

        <View className="gap-2.5 -z-10">
          <Text className="text-base font-bold text-black">Hours</Text>
          <TextInput multiline numberOfLines={3} textAlignVertical="top" placeholder="e.g. Mon-Sat: 8am - 6pm" className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black p-4 h-24 leading-6" value={farmHours} onChangeText={setFarmHours} />
        </View>

        <View className="gap-2.5 -z-10">
          <Text className="text-base font-bold text-black">Delivery & Pickup</Text>
          <TextInput multiline numberOfLines={3} textAlignVertical="top" placeholder="e.g. On-farm Pickup, Local Delivery ($5)" className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black p-4 h-24 leading-6" value={farmDelivery} onChangeText={setFarmDelivery} />
        </View>

        <View className="gap-2.5 -z-10">
          <Text className="text-base font-bold text-black">Farm Tours</Text>
          <TextInput multiline numberOfLines={3} textAlignVertical="top" placeholder="e.g. Guided tours every Sunday at 10am" className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black p-4 h-24 leading-6" value={farmTours} onChangeText={setFarmTours} />
        </View>

        <View className="gap-2.5 -z-10">
          <Text className="text-base font-bold text-black">Certificates</Text>
          <TextInput multiline numberOfLines={3} textAlignVertical="top" placeholder="e.g. Certified Organic, GAP Certified" className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black p-4 h-24 leading-6" value={farmCertificates} onChangeText={setFarmCertificates} />
        </View>
        
        <View className="h-20 -z-10" />

      </ScrollView>
    </View>
  );
}