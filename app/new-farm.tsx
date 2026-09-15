import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { X, Image as ImageIcon, MapPin, Check, ChevronDown } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

export default function CreateFarmScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [location, setLocation] = useState('');
  const [about, setAbout] = useState('');
  
  // URL States
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Location & Map States
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // New Filter & Info States
  const [county, setCounty] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [hasPickup, setHasPickup] = useState(false);
  const [hasDelivery, setHasDelivery] = useState(false);
  const [marketsOnly, setMarketsOnly] = useState(false);
  
  const [websiteLink, setWebsiteLink] = useState('');
  const [socialPlatform, setSocialPlatform] = useState('Instagram');
  const [socialLink, setSocialLink] = useState('');
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);

  const [hours, setHours] = useState('');
  const [delivery, setDelivery] = useState('');
  const [tours, setTours] = useState('');
  const [certs, setCerts] = useState('');

  const handleAddressSearch = async (text: string) => {
    setLocation(text);
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

  const handleSave = async () => {
    if (!name) {
      Alert.alert('Missing Info', 'A farm name is required!');
      return;
    }

    setLoading(true);
    const generatedSlug = handle ? handle.replace('@', '').toLowerCase().replace(/\s+/g, '-') : name.toLowerCase().replace(/\s+/g, '-');

    const { error } = await supabase.from('farms').insert([{
      name: name, slug: generatedSlug, location_address: location || 'Nova Scotia', latitude: lat, longitude: lng, bio: about || 'Newly added farm profile.', hours: hours, delivery_info: delivery, farm_tours: tours, certificates: certs, cover_image_url: coverUrl, avatar_url: logoUrl, county: county, business_type: businessType, has_pickup: hasPickup, has_delivery: hasDelivery, markets_only: marketsOnly, website_link: websiteLink, social_platform: socialPlatform, social_link: socialLink
    }]);

    setLoading(false);

    if (error) {
      Alert.alert('Error Saving Farm', error.message);
      return;
    }

    Alert.alert('Created', 'The new Farm Profile has been generated and saved to the database.', [
      { text: 'Great', onPress: () => router.replace('/(tabs)/') }
    ]);
  };

  const Checkbox = ({ label, value, onToggle }: any) => (
    <TouchableOpacity onPress={onToggle} className="flex-row items-center gap-3 py-2">
      <View className={`w-6 h-6 rounded border items-center justify-center ${value ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>{value && <Check size={16} color="white" />}</View>
      <Text className="text-base text-gray-800">{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/')} className="w-10 h-10 -ml-2 items-center justify-center"><X size={24} color="#000" /></TouchableOpacity>
        <Text className="text-xl font-bold text-black">New Farm</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading || uploading} className="w-16 -mr-2 items-center justify-center">
          {loading ? <ActivityIndicator color="#1d4ed8" /> : <Text className="text-[#1d4ed8] font-bold text-lg">Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="flex-row gap-4 mb-8">
          <TouchableOpacity onPress={() => pickImage('cover')} className="flex-1 h-32 bg-[#eff6ff] rounded-2xl border-2 border-blue-100 border-dashed items-center justify-center overflow-hidden">
            {coverUrl ? <Image source={{ uri: coverUrl }} className="w-full h-full" /> : <><ImageIcon size={28} color="#1d4ed8" /><Text className="text-blue-700 font-bold mt-2 text-xs">Header Image</Text></>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => pickImage('logo')} className="w-32 h-32 bg-[#eff6ff] rounded-2xl border-2 border-blue-100 border-dashed items-center justify-center overflow-hidden">
            {logoUrl ? <Image source={{ uri: logoUrl }} className="w-full h-full" /> : <><ImageIcon size={28} color="#1d4ed8" /><Text className="text-blue-700 font-bold mt-2 text-xs">Logo</Text></>}
          </TouchableOpacity>
        </View>

        <Text className="text-xl font-bold text-black mb-4">Core Info</Text>
        <View className="gap-4 mb-8">
          <View className="gap-2.5">
            <Text className="text-sm font-bold text-black">Farm Name *</Text>
            <Input placeholder="e.g. Sunny Acres" className="rounded-xl border border-gray-200 bg-[#F9FAFB] h-12 text-black" value={name} onChangeText={setName} />
          </View>
          
          <View className="gap-2.5 z-50">
            <Text className="text-base font-bold text-black">Location (Address)</Text>
            <Input className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black h-12" value={location} onChangeText={handleAddressSearch} placeholder="Start typing address..." />
            {suggestions.length > 0 && (
              <View className="bg-white border border-gray-200 rounded-xl mt-1 overflow-hidden shadow-sm absolute top-[76px] w-full z-50">
                {suggestions.map((item, idx) => {
                  const p = item.properties;
                  const fullAddress = `${p.name ? p.name + ', ' : ''}${p.city || p.state}, ${p.country}`;
                  return (
                    <TouchableOpacity 
                      key={idx} onPress={() => { setLocation(fullAddress); if (item.geometry && item.geometry.coordinates) { setLng(item.geometry.coordinates[0]); setLat(item.geometry.coordinates[1]); } setSuggestions([]); }}
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
            <Text className="text-sm font-bold text-black">Primary Social Username</Text>
            <Input placeholder="e.g. @sunnyacres" autoCapitalize="none" className="rounded-xl border border-gray-200 bg-[#F9FAFB] h-12 text-black" value={handle} onChangeText={setHandle} />
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
            <Text className="text-sm font-bold text-black">About Blurb</Text>
            <TextInput placeholder="Farm description..." multiline numberOfLines={4} textAlignVertical="top" className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black p-4 h-32" value={about} onChangeText={setAbout} />
          </View>
        </View>

        <Text className="text-xl font-bold text-black mb-4 -z-10">Filter Details</Text>
        <View className="gap-5 mb-8 -z-10">
          <View className="gap-2.5">
            <Text className="text-sm font-bold text-black">County</Text>
            <Input placeholder="e.g. Kings County" className="rounded-xl border border-gray-200 bg-[#F9FAFB] h-12 text-black" value={county} onChangeText={setCounty} />
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

        <Text className="text-xl font-bold text-black mb-4 -z-10">Info Cards</Text>
        <View className="gap-4 mb-8 -z-10">
          <View className="gap-2.5">
            <Text className="text-sm font-bold text-black">Hours</Text>
            <TextInput placeholder="e.g. Mon-Fri 8am to 5pm" multiline textAlignVertical="top" className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black p-4 h-24" value={hours} onChangeText={setHours} />
          </View>
          <View className="gap-2.5">
            <Text className="text-sm font-bold text-black">Delivery Details</Text>
            <TextInput placeholder="e.g. Local delivery within 15km" multiline textAlignVertical="top" className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black p-4 h-24" value={delivery} onChangeText={setDelivery} />
          </View>
          <View className="gap-2.5">
            <Text className="text-sm font-bold text-black">Farm Tours</Text>
            <TextInput placeholder="e.g. Guided tours every Saturday" multiline textAlignVertical="top" className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black p-4 h-24" value={tours} onChangeText={setTours} />
          </View>
          <View className="gap-2.5">
            <Text className="text-sm font-bold text-black">Certificates</Text>
            <TextInput placeholder="e.g. Certified Organic" multiline textAlignVertical="top" className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black p-4 h-24" value={certs} onChangeText={setCerts} />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}