import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Bookmark, Calendar } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function SavedFeed() {
  // 1. ALL HOOKS AT THE TOP
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [isGuest, setIsGuest] = useState<boolean | null>(null);
  
  const [activeTab, setActiveTab] = useState('Farms');
  const [loading, setLoading] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const [savedFarms, setSavedFarms] = useState<any[]>([]);
  const [savedEvents, setSavedEvents] = useState<any[]>([]);
  const [savedUpdates, setSavedUpdates] = useState<any[]>([]);
  
  // 2. CHECK GUEST STATUS
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsGuest(session?.user?.is_anonymous ?? false);
    });
  }, []);

  // 3. LOAD SAVED ITEMS (Skip if guest)
  useFocusEffect(
    useCallback(() => {
      if (isGuest === null || isGuest === true) {
        setLoading(false);
        return;
      }

      fadeAnim.setValue(0);
      setLoading(true);

      async function fetchSavedItems() {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) return;
          const userId = session.user.id;

          const { data: sFarms } = await supabase.from('saved_farms').select('farm_id, farms(*)').eq('user_id', userId);
          if (sFarms) {
            setSavedFarms(sFarms.map((sf: any) => ({
              id: sf.farms.id,
              name: sf.farms.name,
              coverImage: sf.farms.cover_image_url,
              location: sf.farms.location_address || 'Nova Scotia',
              saved: true
            })));
          }

          const { data: sEvents } = await supabase.from('saved_events').select('event_id, events(*)').eq('user_id', userId);
          if (sEvents) {
            setSavedEvents(sEvents.map((se: any) => {
              let safeDate = 'Upcoming';
              try { if (se.events.start_time) safeDate = new Date(se.events.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch (e) {}
              return { id: se.events.id, title: se.events.title, date: safeDate, saved: true };
            }));
          }

          const { data: sUpdates } = await supabase.from('saved_updates').select('update_id, updates(*, profiles:author_id(first_name, last_name, avatar_url, role))').eq('user_id', userId);
          if (sUpdates) {
            setSavedUpdates(sUpdates.map((su: any) => {
              const u = su.updates;
              const profile = Array.isArray(u.profiles) ? u.profiles[0] : u.profiles;
              const isPostAdmin = profile?.role === 'admin';
              return { id: u.id, content: u.content, author: isPostAdmin ? 'HarvestNS' : `${profile?.first_name || 'Farm'} ${profile?.last_name || 'Producer'}`, avatar: profile?.avatar_url, saved: true };
            }));
          }
        } catch (error) {
          console.error("Error fetching saved items:", error);
        } finally {
          setLoading(false);
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        }
      }

      fetchSavedItems();
    }, [fadeAnim, isGuest])
  );

  const handleUnsave = async (tableName: string, idColumn: string, itemId: string) => {
    if (tableName === 'saved_farms') setSavedFarms(prev => prev.filter(item => item.id !== itemId));
    if (tableName === 'saved_events') setSavedEvents(prev => prev.filter(item => item.id !== itemId));
    if (tableName === 'saved_updates') setSavedUpdates(prev => prev.filter(item => item.id !== itemId));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      await supabase.from(tableName).delete().eq(idColumn, itemId).eq('user_id', session.user.id);
    } catch (error) {}
  };

  // ====================================================
  // RENDER PHASE
  // ====================================================

  if (isGuest === null) {
    return <View className="flex-1 justify-center items-center bg-white"><ActivityIndicator color="#1d4ed8" size="large" /></View>;
  }

  // APPLE REVIEWER FIX: Guest Lock Screen for Saved Feed
  if (isGuest) {
    return (
      <View className="flex-1 justify-center items-center px-8 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-6">
          <Bookmark size={32} color="#1d4ed8" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">Account Required</Text>
        <Text className="text-base text-gray-500 text-center mb-8 leading-relaxed">
          Create a free account to save your favorite farms, events, and community updates.
        </Text>
        
<TouchableOpacity 
  onPress={async () => {
    // 1. Sign out of the temporary guest session first
    await supabase.auth.signOut();
    // 2. Then navigate to the login screen
    router.replace('/login');
  }}
  className="bg-blue-700 w-full py-4 rounded-xl items-center shadow-sm"
>
  <Text className="text-white font-bold text-lg">Sign Up / Log In</Text>
</TouchableOpacity>
      </View>
    );
  }

  // NORMAL SAVED SCREEN
  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100 bg-white" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <View className="w-16 h-10" /> 
        <Text className="text-xl font-bold text-black">Saved</Text>
        <View className="w-16 h-10" /> 
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">

          <View className="flex-row bg-gray-100 p-1 rounded-full mb-6 mx-0">
            {['Farms', 'Updates & Events'].map(tab => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[{ flex: 1, paddingVertical: 8, borderRadius: 9999, alignItems: 'center' }, activeTab === tab ? { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2 } : {}]}>
                <Text style={[{ fontWeight: '600' }, activeTab === tab ? { color: 'black' } : { color: '#6b7280' }]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View className="h-64" /> 
          ) : (
            <Animated.View style={{ opacity: fadeAnim }}>
              {activeTab === 'Farms' && (
                <View className="gap-4">
                  {savedFarms.length === 0 && <Text className="text-gray-500 text-center mt-10">No saved farms yet.</Text>}
                  {savedFarms.map(farm => (
                    <TouchableOpacity key={farm.id} activeOpacity={0.9} onPress={() => router.push(`/farm/${farm.id}`)} className="bg-white border border-gray-200 rounded-2xl p-4 flex-row items-center shadow-sm">
                      <View className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden mr-4 border border-gray-200">
                        {farm.coverImage ? <Image source={{ uri: farm.coverImage }} className="w-full h-full" /> : <View className="w-full h-full items-center justify-center bg-gray-200"><Text>🚜</Text></View>}
                      </View>
                      <View className="flex-1 pr-4">
                        <Text className="text-lg font-bold text-black mb-1">{farm.name}</Text>
                        <Text className="text-sm text-gray-500">📍 {farm.location}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleUnsave('saved_farms', 'farm_id', farm.id)} className="p-2">
                        <Bookmark size={24} color="#1d4ed8" fill="#1d4ed8" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {activeTab === 'Updates & Events' && (
                <View className="gap-4">
                  {savedEvents.length === 0 && savedUpdates.length === 0 && <Text className="text-gray-500 text-center mt-10">No saved updates or events yet.</Text>}
                  
                  {savedEvents.map(event => (
                    <TouchableOpacity key={event.id} activeOpacity={0.9} onPress={() => router.push(`/event/${event.id}`)} className="bg-white border border-gray-200 rounded-2xl p-4 flex-row items-center shadow-sm">
                      <View className="w-14 h-14 bg-[#eff6ff] rounded-2xl items-center justify-center mr-4 border border-blue-100">
                        <Calendar size={24} color="#1d4ed8" />
                      </View>
                      <View className="flex-1 pr-4">
                        <Text className="text-base font-bold text-black mb-1">{event.title}</Text>
                        <Text className="text-sm font-semibold text-[#1d4ed8]">{event.date}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleUnsave('saved_events', 'event_id', event.id)} className="p-2">
                        <Bookmark size={24} color="#1d4ed8" fill="#1d4ed8" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}

                  {savedUpdates.map(update => (
                    <View key={update.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center gap-3">
                          <View className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                            {update.avatar && <Image source={{ uri: update.avatar }} className="w-full h-full" />}
                          </View>
                          <Text className="text-base font-bold text-black">{update.author}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleUnsave('saved_updates', 'update_id', update.id)}>
                          <Bookmark size={24} color="#1d4ed8" fill="#1d4ed8" />
                        </TouchableOpacity>
                      </View>
                      <Text className="text-base text-gray-700 leading-6">{update.content}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}