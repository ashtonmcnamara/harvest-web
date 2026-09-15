import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { X, Calendar, MapPin } from 'lucide-react-native';
import DateTimePickerModal from '@/components/add/DateTimePickerModal';
import { supabase } from '@/lib/supabase';

export default function EditEventScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);

  const [eventTitle, setEventTitle] = useState('');
  const [eventDateString, setEventDateString] = useState('Select date...'); 
  const [eventLocation, setEventLocation] = useState(''); 
  const [eventDetails, setEventDetails] = useState('');
  const [eventType, setEventType] = useState('');
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  useEffect(() => {
    async function loadEvent() {
      if (!id) return;
      try {
        const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
        if (error) throw error;
        
        if (data) {
          setEventTitle(data.title || '');
          setEventLocation(data.location || '');
          setEventDetails(data.description || '');
          setEventType(data.event_type || '');
          setLat(data.latitude || null);
          setLng(data.longitude || null);
          if (data.start_time) {
            setEventDateString(new Date(data.start_time).toLocaleString('en-US', { 
              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
            }));
          }
        }
      } catch (error) {
        Alert.alert("Error", "Could not load event data.");
        router.back();
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  const handleAddressSearch = async (text: string) => {
    setEventLocation(text);
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

  const handleSelectAddress = (feature: any) => {
    const props = feature.properties;
    const address = `${props.name ? props.name + ', ' : ''}${props.city || props.state}, ${props.country}`;
    setEventLocation(address);
    if (feature.geometry && feature.geometry.coordinates) {
      setLng(feature.geometry.coordinates[0]);
      setLat(feature.geometry.coordinates[1]);
    }
    setSuggestions([]);
  };

  const handleUpdate = async () => {
    if (!eventTitle) {
      Alert.alert('Missing Info', 'Event Title is required.');
      return;
    }
    setSaving(true);
    try {
      let startTime = new Date().toISOString();
      try {
        if (eventDateString !== 'Select date...') {
          const parsed = new Date(eventDateString);
          if (!isNaN(parsed.getTime())) startTime = parsed.toISOString();
        }
      } catch (e) {}

      const { error } = await supabase.from('events').update({
        title: eventTitle,
        location: eventLocation,
        latitude: lat,
        longitude: lng,
        event_type: eventType,
        description: eventDetails,
        start_time: startTime
      }).eq('id', id);

      if (error) throw error;
      Alert.alert('Success', 'Event updated successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Update Failed', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator size="large" color="#1d4ed8" /></View>;

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 -ml-2 items-center justify-center">
          <X size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black">Edit Event</Text>
        <TouchableOpacity onPress={handleUpdate} disabled={saving} className="w-16 -mr-2 items-center justify-center">
          {saving ? <ActivityIndicator color="#1d4ed8" /> : <Text className="text-[#1d4ed8] font-bold text-lg">Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-6 gap-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="gap-2.5">
          <Text className="text-base font-bold text-black">Event Title</Text>
          <Input className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black h-12" value={eventTitle} onChangeText={setEventTitle} />
        </View>

        <View className="gap-2.5">
          <Text className="text-base font-bold text-black">Date & Time</Text>
          <TouchableOpacity onPress={() => setShowDateTimePicker(true)} className="flex-row items-center justify-between border border-gray-200 rounded-xl px-4 h-12 bg-[#F9FAFB]">
            <Text className="text-base text-gray-800">{eventDateString}</Text>
            <Calendar size={20} color="#333" />
          </TouchableOpacity>
        </View>

        <View className="gap-2.5 z-50">
          <Text className="text-base font-bold text-black">Location</Text>
          <Input 
            className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black h-12" 
            value={eventLocation} 
            onChangeText={handleAddressSearch} 
            placeholder="Start typing address..." 
          />
          
          {suggestions.length > 0 && (
            <View className="bg-white border border-gray-200 rounded-xl mt-1 overflow-hidden shadow-sm absolute top-[76px] w-full z-50">
              {suggestions.map((item, idx) => {
                const p = item.properties;
                const fullAddress = `${p.name ? p.name + ', ' : ''}${p.city || p.state}, ${p.country}`;
                return (
                  <TouchableOpacity 
                    key={idx} onPress={() => handleSelectAddress(item)}
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

        <View className="gap-2.5 -z-10">
          <Text className="text-base font-bold text-black">Event Type</Text>
          <View className="flex-row flex-wrap gap-2">
            {['Market', 'Workshop', 'Tour', 'Festival', 'Other'].map(type => (
              <TouchableOpacity 
                key={type} 
                onPress={() => setEventType(type)} 
                className={`px-4 py-2 rounded-full border ${eventType === type ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
              >
                <Text className={eventType === type ? 'text-blue-700 font-bold' : 'text-gray-600 font-medium'}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="gap-2.5 -z-10 mt-2">
          <Text className="text-base font-bold text-black">Description</Text>
          <TextInput multiline numberOfLines={8} textAlignVertical="top" className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black p-4 h-40 leading-6 text-base" value={eventDetails} onChangeText={setEventDetails} />
        </View>
        <View className="h-20" />
      </ScrollView>

      <DateTimePickerModal visible={showDateTimePicker} onClose={() => setShowDateTimePicker(false)} onConfirm={setEventDateString} />
    </View>
  );
}