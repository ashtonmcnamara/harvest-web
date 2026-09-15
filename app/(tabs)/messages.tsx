import React, { useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/context/AuthContext';

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userMode } = useAuth();
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function loadConversations() {
        setLoading(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) return;
          const userId = session.user.id;

          // NEW: Grab the IDs of everyone we've blocked
          const { data: blockedData } = await supabase.from('blocked_users').select('blocked_id').eq('blocker_id', userId);
          const blockedIds = new Set(blockedData?.map((b: any) => b.blocked_id) || []);

          let query = supabase.from('conversations').select('id, updated_at, consumer_id, farms(id, name, avatar_url)');
          
          if (userMode === 'producer') {
            const { data: myFarm } = await supabase.from('farm_members').select('farm_id').eq('user_id', userId).single();
            if (myFarm) query = query.eq('farm_id', myFarm.farm_id);
          } else {
            query = query.eq('consumer_id', userId);
          }

          const { data: convos } = await query.order('updated_at', { ascending: false });

          if (convos) {
            const formatted = (await Promise.all(convos.map(async (c: any) => {
              
              // NEW: Instantly drop the conversation if we blocked the consumer!
              if (userMode === 'producer' && blockedIds.has(c.consumer_id)) return null;

              const { data: lastMsg } = await supabase.from('messages')
                .select('content, created_at, sender_id, is_read')
                .eq('conversation_id', c.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

              // NEW: Drop the conversation if the sender of the message is blocked!
              if (lastMsg && blockedIds.has(lastMsg.sender_id)) return null;

              const farmData = Array.isArray(c.farms) ? c.farms[0] : c.farms;
              
              let displayName = farmData?.name || 'Unknown Farm';
              let displayAvatar = farmData?.avatar_url;
              let isAdminChat = false;

              if (userMode === 'producer') {
                const { data: profile } = await supabase.from('profiles').select('first_name, last_name, avatar_url, role').eq('id', c.consumer_id).single();
                if (profile) {
                  if (profile.role === 'admin') {
                    displayName = 'HarvestNS Admin';
                    isAdminChat = true;
                  } else {
                    displayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'HarvestNS User';
                    displayAvatar = profile.avatar_url;
                  }
                }
              }

              const hasUnread = lastMsg ? (lastMsg.sender_id !== userId && !lastMsg.is_read) : false;

              let timeString = '';
              if (lastMsg) {
                const msgDate = new Date(lastMsg.created_at);
                const today = new Date();
                if (msgDate.toDateString() === today.toDateString()) {
                  timeString = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else {
                  timeString = msgDate.toLocaleDateString([], { weekday: 'long' });
                }
              }

              return {
                id: c.id,
                displayName,
                displayAvatar,
                isAdminChat,
                lastMessage: lastMsg ? lastMsg.content : 'No messages yet.',
                time: timeString,
                hasUnread
              };
            }))).filter(Boolean); // Filters out any `null` conversations we skipped!

            setConversations(formatted);
          }
        } catch (error) {
          console.error("Error loading conversations:", error);
        } finally {
          setLoading(false);
        }
      }
      loadConversations();
    }, [userMode])
  );

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="px-5 pb-4 pt-4 border-b border-gray-100">
        <Text className="text-3xl font-bold text-black">Messages</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1d4ed8" className="mt-10" />
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {conversations.length === 0 ? (
            <Text className="text-gray-500 text-center mt-10">No conversations yet.</Text>
          ) : (
            conversations.map((convo, index) => (
              <TouchableOpacity 
                key={convo.id} 
                onPress={() => router.push(`/message/${convo.id}`)}
                className={`flex-row items-center p-5 ${index !== conversations.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <View className="mr-4 relative">
                  <View className="w-14 h-14 bg-gray-100 rounded-full border border-gray-200 overflow-hidden items-center justify-center">
                    {convo.isAdminChat ? (
                       <Image source={require('@/assets/images/logo-icon.png')} className="w-full h-full" resizeMode="contain" />
                    ) : convo.displayAvatar ? (
                       <Image source={{ uri: convo.displayAvatar }} className="w-full h-full" />
                    ) : (
                       <Text className="text-2xl">{userMode === 'consumer' ? '🚜' : '👤'}</Text>
                    )}
                  </View>
                  {convo.hasUnread && <View className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#1d4ed8] rounded-full border-2 border-white z-10" />}
                </View>

                <View className="flex-1 pr-2">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-base font-bold text-black">{convo.displayName}</Text>
                    <Text className={`text-xs ${convo.hasUnread ? 'text-[#1d4ed8] font-bold' : 'text-gray-500'}`}>{convo.time}</Text>
                  </View>
                  <Text className={`text-sm ${convo.hasUnread ? 'text-black font-medium' : 'text-gray-500'}`} numberOfLines={1}>
                    {convo.lastMessage}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}