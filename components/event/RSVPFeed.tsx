import React, { useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Calendar, ChevronLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function RSVPFeed() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [rsvpedEvents, setRsvpedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function fetchRSVPs() {
        setLoading(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) return;

          // Ask Supabase for the RSVPs, and JOIN the events table to get the title and dates
          const { data, error } = await supabase
            .from('event_rsvps')
            .select('events(*)')
            .eq('user_id', session.user.id);
            
          if (error) throw error;
          
          if (data) {
            const formatted = data
              .filter((r: any) => r.events) // Filter out nulls if an event was deleted
              .map((r: any) => {
                const e = r.events;
                let safeDate = 'Upcoming';
                try {
                  if (e.start_time) safeDate = new Date(e.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                } catch (err) {}
                
                return {
                  id: e.id,
                  title: e.title,
                  location: e.location || 'Nova Scotia',
                  date: safeDate
                };
            });
            setRsvpedEvents(formatted);
          }
        } catch (error) {
          console.error("Error fetching RSVPs:", error);
        } finally {
          setLoading(false);
        }
      }
      
      fetchRSVPs();
    }, [])
  );

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <View className="flex-row items-center px-5 pb-4 border-b border-gray-100 bg-white" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black ml-4">RSVP'd Events</Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#1d4ed8" className="mt-10" />
      ) : (
        <ScrollView className="flex-1 p-5">
          {rsvpedEvents.length === 0 ? (
            <Text className="text-gray-500 text-center mt-10 text-base">You haven't RSVP'd to any events yet.</Text>
          ) : (
            <View className="gap-4 pb-10">
              {rsvpedEvents.map(event => (
                <TouchableOpacity 
                  key={event.id} 
                  activeOpacity={0.9}
                  onPress={() => router.push(`/event/${event.id}`)}
                  className="bg-white border border-gray-200 rounded-3xl p-4 flex-row items-start shadow-sm"
                >
                  <View className="w-14 h-14 bg-[#eff6ff] rounded-2xl items-center justify-center mr-4">
                    <Calendar size={24} color="#1d4ed8" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-gray-900 leading-tight mb-1">{event.title}</Text>
                    <Text className="text-sm font-medium text-gray-500 mb-1">{event.location}</Text>
                    <Text className="text-sm font-semibold text-blue-700">{event.date}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}