import React, { useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Share as NativeShare } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'; 
import { Text } from '@/components/ui/text';
import { ChevronLeft, Bookmark, Pin, Calendar, Heart, Users, Pencil, BadgeCheck, Share as ShareIcon } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/context/AuthContext';
import LocationMap from '@/components/ui/LocationMap';

const handleGuestAction = (router: any, actionName: string) => {
  Alert.alert(
    'Account Required',
    `You must create a free account to ${actionName}.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Up / Log In', onPress: async () => { await supabase.auth.signOut(); router.replace('/login'); } }
    ]
  );
};

export default function EventProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter(); 
  const { id } = useLocalSearchParams();
  const { userMode } = useAuth();
  
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  
  const [isSaved, setIsSaved] = useState(false);
  const [isRsvped, setIsRsvped] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;

      async function fetchEventDetails() {
        setLoading(true);
        try {
          const { data: eventData, error } = await supabase
            .from('events')
            .select('*, farms(id, name, avatar_url)')
            .eq('id', id)
            .single();

          if (error) throw error;
          if (eventData) {
            setActiveEvent(eventData);
            setRsvpCount(eventData.rsvp_count || 0);
          }

          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setIsGuest(session.user.is_anonymous ?? false);
            
            if (!session.user.is_anonymous) {
              setCurrentUserId(session.user.id);
              
              const { data: savedData } = await supabase.from('saved_events').select('*').eq('event_id', id).eq('user_id', session.user.id).single();
              if (savedData) setIsSaved(true);

              const { data: rsvpData } = await supabase.from('event_rsvps').select('*').eq('event_id', id).eq('user_id', session.user.id).single();
              if (rsvpData) setIsRsvped(true);

              const { data: likeData } = await supabase.from('event_likes').select('*').eq('event_id', id).eq('user_id', session.user.id).single();
              if (likeData) setIsLiked(true);
            }
          }
          
          // Always get total likes
          const { count } = await supabase.from('event_likes').select('*', { count: 'exact', head: true }).eq('event_id', id);
          if (count !== null) setLikesCount(count);
          
        } catch (error) {
          console.error('Error fetching event details:', error);
        } finally {
          setLoading(false);
        }
      }

      fetchEventDetails();
    }, [id])
  );

  const handleShare = async () => {
    if (!activeEvent) return; 
    try {
      await NativeShare.share({ 
        message: `Check out ${activeEvent.title} on HarvestNS! https://harvestns.com/event/${id}`,
        url: `https://harvestns.com/event/${id}` 
      });
    } catch (error) {
      console.log(error);
    }
  };

  const toggleRSVP = async () => {
    if (isGuest) return handleGuestAction(router, 'RSVP to this event');

    const previousState = isRsvped;
    setIsRsvped(!previousState);
    setRsvpCount(prev => previousState ? prev - 1 : prev + 1);

    try {
      if (!currentUserId) return;
      if (previousState) {
        await supabase.from('event_rsvps').delete().eq('event_id', id).eq('user_id', currentUserId);
      } else {
        await supabase.from('event_rsvps').insert({ event_id: id, user_id: currentUserId, status: 'going' });
      }
    } catch (error) {
      setIsRsvped(previousState);
      setRsvpCount(prev => previousState ? prev + 1 : prev - 1);
    }
  };

  const toggleSave = async () => {
    if (isGuest) return handleGuestAction(router, 'save this event');

    const previousState = isSaved;
    setIsSaved(!previousState);
    
    try {
      if (!currentUserId) return;
      if (previousState) {
        await supabase.from('saved_events').delete().eq('event_id', id).eq('user_id', currentUserId);
      } else {
        await supabase.from('saved_events').insert({ event_id: id, user_id: currentUserId });
      }
    } catch (error) {
      setIsSaved(previousState);
    }
  };

  const toggleLike = async () => {
    if (isGuest) return handleGuestAction(router, 'like this event');

    const previousState = isLiked;
    setIsLiked(!previousState);
    setLikesCount(prev => previousState ? prev - 1 : prev + 1);

    try {
      if (!currentUserId) return;
      if (previousState) {
        await supabase.from('event_likes').delete().eq('event_id', id).eq('user_id', currentUserId);
      } else {
        await supabase.from('event_likes').insert({ event_id: id, user_id: currentUserId });
      }
    } catch (error) {
      setIsLiked(previousState);
      setLikesCount(prev => previousState ? prev + 1 : prev - 1);
    }
  };

  const togglePin = async () => {
    const previousState = activeEvent.is_pinned;
    setActiveEvent({ ...activeEvent, is_pinned: !previousState });
    try {
      await supabase.from('events').update({ is_pinned: !previousState }).eq('id', id);
    } catch (error) {
      setActiveEvent({ ...activeEvent, is_pinned: previousState });
    }
  };

  const handleDeleteEvent = async () => {
    Alert.alert('Delete Event', 'Are you sure you want to permanently delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('events').delete().eq('id', id);
            router.replace('/(tabs)/');
          } catch (error) {
            console.error("Delete Error:", error);
          }
        }
      }
    ]);
  };

  if (loading) {
    return <View className="flex-1 items-center justify-center bg-[#F9FAFB]"><ActivityIndicator size="large" color="#1d4ed8" /></View>;
  }

  if (!activeEvent) return null;

  const startDate = new Date(activeEvent.start_time);
  const formattedDate = startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const formattedTime = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  
  const isAdmin = userMode === 'admin';
  const isCreator = currentUserId === activeEvent.author_id; 
  const canEditDescription = (isAdmin || isCreator) && !isGuest;

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        <View className="px-5 flex-row justify-between items-center" style={{ paddingTop: Math.max(insets.top, 16) }}>
<TouchableOpacity 
  onPress={() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)'); // Fallback to home feed on direct web loads
    }
  }} 
  className="w-10 h-10 bg-black/40 rounded-full items-center justify-center backdrop-blur-md border border-white/20"
>
  <ChevronLeft size={24} color="white" />
</TouchableOpacity>
          <View className="flex-row gap-3">
            {canEditDescription && (
              <TouchableOpacity onPress={handleDeleteEvent} className="bg-[#ff4d4f] px-3 py-1.5 rounded-full mr-2 self-center">
                <Text className="text-white font-bold text-sm">Delete</Text>
              </TouchableOpacity>
            )}
            
            {canEditDescription && (
              <TouchableOpacity onPress={() => router.push(`/edit-event?id=${id}`)} className="w-10 h-10 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm">
                <Pencil size={18} color="#1d4ed8" />
              </TouchableOpacity>
            )}

            {isAdmin && (
              <TouchableOpacity onPress={togglePin} className="w-10 h-10 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm">
                <Pin size={20} color={activeEvent.is_pinned ? '#1d4ed8' : '#888'} fill={activeEvent.is_pinned ? '#1d4ed8' : 'none'} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity onPress={handleShare} className="w-10 h-10 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm">
              <ShareIcon size={18} color="#333" />
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleSave} className="w-10 h-10 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm">
              <Bookmark size={20} color={isSaved ? '#1d4ed8' : '#888'} fill={isSaved ? '#1d4ed8' : 'none'} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-5 pt-6 pb-12">
          
          <View className="w-14 h-14 bg-[#eff6ff] rounded-2xl items-center justify-center mb-6 border border-blue-100 shadow-sm">
            <Calendar size={28} color="#1d4ed8" />
          </View>
          <Text className="text-3xl font-bold text-black leading-tight mb-4">{activeEvent.title}</Text>
          <View className="self-start bg-[#eff6ff] px-4 py-2 rounded-full border border-blue-100 mb-8">
            <Text className="text-blue-700 font-bold text-sm">{formattedDate} at {formattedTime}</Text>
          </View>

          <View className="flex-row gap-4 mb-6">
            <TouchableOpacity 
              onPress={toggleRSVP}
              className={`flex-1 flex-row items-center justify-center py-4 rounded-2xl gap-2 shadow-sm ${isRsvped ? 'bg-green-600' : 'bg-[#1d4ed8]'}`}
            >
              <BadgeCheck size={20} color="white" />
              <Text className="text-white font-bold text-base">{isRsvped ? 'RSVP Confirmed' : 'RSVP Now'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={toggleLike} className="w-16 bg-white border border-gray-200 rounded-2xl items-center justify-center shadow-sm py-2">
              <Heart size={20} color={isLiked ? '#ef4444' : '#888'} fill={isLiked ? '#ef4444' : 'none'} />
              <Text className="text-xs font-bold text-gray-500 mt-1">{likesCount}</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-2xl gap-3 mb-8">
            <Users size={20} color="#1d4ed8" />
            <Text className="text-base font-bold text-black">{rsvpCount} people going</Text>
          </View>

          <View className="bg-[#F3F4F6] border border-gray-200 p-5 rounded-2xl mb-8">
            <Text className="text-lg font-bold text-black mb-3">Description</Text>
            <Text className="text-gray-700 text-base leading-6">{activeEvent.description}</Text>
          </View>

          {(activeEvent.latitude && activeEvent.longitude) ? (
            <View className="bg-[#F3F4F6] border border-gray-200 overflow-hidden rounded-2xl mb-8">
              <View className="p-5 pb-4 border-b border-gray-200 bg-white">
                <Text className="text-lg font-bold text-black mb-1">Location</Text>
                <Text className="text-gray-700 text-base">{activeEvent.location}</Text>
              </View>
<View className="h-48 w-full">
  <LocationMap 
    latitude={activeEvent.latitude} 
    longitude={activeEvent.longitude} 
    title={activeEvent.title} 
  />
</View>
            </View>
          ) : (
            <View className="bg-[#F3F4F6] border border-gray-200 p-5 rounded-2xl mb-8">
              <Text className="text-lg font-bold text-black mb-3">Location</Text>
              <Text className="text-gray-700 text-base leading-6">{activeEvent.location || 'Location TBD'}</Text>
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}