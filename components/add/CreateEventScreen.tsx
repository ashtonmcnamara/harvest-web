import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { X, Calendar, MapPin } from 'lucide-react-native';
import DateTimePickerModal from '@/components/add/DateTimePickerModal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/context/AuthContext';

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userMode } = useAuth();
  const isAdmin = userMode === 'admin';
  
  const [eventTitle, setEventTitle] = useState('');
  const [eventDateString, setEventDateString] = useState('Select date...'); 
  const [eventLocation, setEventLocation] = useState(''); 
  const [eventDetails, setEventDetails] = useState('');
  const [eventType, setEventType] = useState(''); // NEW!

  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const [availableFarms, setAvailableFarms] = useState<any[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [fetchingFarms, setFetchingFarms] = useState(true);

  // Autocomplete States
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  useEffect(() => {
    async function loadFarms() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      let query;
      if (isAdmin) {
        query = supabase.from('farms').select('id, name');
      } else {
        query = supabase.from('farms').select('id, name, farm_members!inner(user_id)').eq('farm_members.user_id', session.user.id);
      }

      const { data } = await query;
      if (data && data.length > 0) {
        setAvailableFarms(data);
        setSelectedFarmId(data[0].id);
      }
      setFetchingFarms(false);
    }
    loadFarms();
  }, [isAdmin]);

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

  const handleSaveEvent = async () => {
    if (!eventTitle) {
      Alert.alert('Missing Info', 'Please enter an event title!');
      return;
    }

    if (!isAdmin && !selectedFarmId) {
      Alert.alert('No Farm Found', 'You must create a farm profile before you can post an event.');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('You must be logged in.');

      let startTime = new Date().toISOString();
      try {
        if (eventDateString !== 'Select date...') {
          const parsed = new Date(eventDateString);
          if (!isNaN(parsed.getTime())) startTime = parsed.toISOString();
        }
      } catch (e) {}
      
      const endTime = new Date(new Date(startTime).getTime() + 2 * 60 * 60 * 1000).toISOString();

      const insertPayload = {
        title: eventTitle,
        description: eventDetails || 'No description provided.',
        location: eventLocation || 'Location TBD',
        latitude: lat,
        longitude: lng,
        event_type: eventType,
        start_time: startTime,
        end_time: endTime,
        farm_id: isAdmin ? null : selectedFarmId,
        author_id: session.user.id
      };
      
      const { error } = await supabase.from('events').insert([insertPayload]); 

      if (error) throw new Error(error.message);

      Alert.alert('Success!', 'Your event is now live on the feed.', [{ text: 'Awesome', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Event Creation Failed', error.message);
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
        <Text className="text-xl font-bold text-black">Add Event</Text>
        <TouchableOpacity onPress={handleSaveEvent} disabled={loading || fetchingFarms} className="w-16 -mr-2 items-center justify-center">
          {loading ? <ActivityIndicator color="#1d4ed8" /> : <Text className="text-[#1d4ed8] font-bold text-lg">Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View className="p-6 gap-6">
          
          {isAdmin ? (
             <View className="bg-purple-50 border border-purple-100 p-3 rounded-xl mb-2">
               <Text className="text-purple-800 text-sm font-medium">Hosting as: <Text className="font-bold">HarvestNS Admin</Text></Text>
             </View>
          ) : (
             !fetchingFarms && availableFarms.length > 0 && (
               <View className="bg-blue-50 border border-blue-100 p-3 rounded-xl mb-2">
                 <Text className="text-blue-800 text-sm font-medium">Hosting as: <Text className="font-bold">{availableFarms.find(f => f.id === selectedFarmId)?.name}</Text></Text>
               </View>
             )
          )}

          <View className="gap-2.5">
            <Text className="text-base font-bold text-black">Event Title</Text>
            <Input placeholder="Enter title..." className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black h-12" placeholderTextColor="#9CA3AF" value={eventTitle} onChangeText={setEventTitle} />
          </View>

          <View className="gap-2.5">
            <Text className="text-base font-bold text-black">Date & Time</Text>
            <TouchableOpacity onPress={() => setShowDateTimePicker(true)} className="flex-row items-center justify-between border border-gray-200 rounded-xl px-4 h-12 bg-[#F9FAFB]">
              <Text className={`text-base ${eventDateString === 'Select date...' ? 'text-gray-400' : 'text-gray-800'}`}>{eventDateString}</Text>
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
                      key={idx} 
                      onPress={() => {
                        setEventLocation(fullAddress); 
                        if (item.geometry && item.geometry.coordinates) {
                          setLng(item.geometry.coordinates[0]);
                          setLat(item.geometry.coordinates[1]);
                        }
                        setSuggestions([]);
                      }}
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
            <TextInput placeholder="Event details..." multiline numberOfLines={10} textAlignVertical="top" className="rounded-xl border border-gray-200 bg-[#F9FAFB] text-black p-4 h-48 leading-6 text-base" placeholderTextColor="#9CA3AF" value={eventDetails} onChangeText={setEventDetails} />
          </View>
        </View>
      </ScrollView>

      <DateTimePickerModal visible={showDateTimePicker} onClose={() => setShowDateTimePicker(false)} onConfirm={setEventDateString} />
    </View>
  );
}