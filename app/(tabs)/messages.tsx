import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/context/AuthContext';
import { MessageCircle } from 'lucide-react-native';

export default function MessagesScreen() {
  // 1. ALL HOOKS MUST BE DECLARED AT THE TOP
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userMode } = useAuth();
  
  const [isGuest, setIsGuest] = useState<boolean | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. CHECK GUEST STATUS
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsGuest(session?.user?.is_anonymous ?? false);
    });
  }, []);

  // 3. LOAD CONVERSATIONS (Only if NOT a guest)
  useFocusEffect(
    useCallback(() => {
      // If we don't know the guest status yet, or if they ARE a guest, don't fetch messages
      if (isGuest === null || isGuest === true) {
        setLoading(false);
        return;
      }

      async function loadConversations() {
        setLoading(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) return;
          const userId = session.user.id;

          // Grab the IDs of everyone we've blocked
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
              
              // Instantly drop the conversation if we blocked the consumer
              if (userMode === 'producer' && blockedIds.has(c.consumer_id)) return null;

              const { data: lastMsg } = await supabase.from('messages')
                .select('content, created_at, sender_id, is_read')
                .eq('conversation_id', c.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

              // Drop the conversation if the sender of the message is blocked
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
            }))).filter(Boolean);

            setConversations(formatted);
          }
        } catch (error) {
          console.error("Error loading conversations:", error);
        } finally {
          setLoading(false);
        }
      }
      loadConversations();
    }, [userMode, isGuest]) // Added isGuest to dependency array
  );

  // ====================================================
  // RENDER PHASE (Early returns are safe down here!)
  // ====================================================

  // Loading state while checking guest status
  if (isGuest === null) {
    return <View className="flex-1 justify-center items-center bg-white"><ActivityIndicator color="#1d4ed8" size="large" /></View>;
  }

  // APPLE REVIEWER FIX: The Guest Lock Screen
  if (isGuest) {
    return (
      <View className="flex-1 justify-center items-center px-8 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-6">
          <MessageCircle size={32} color="#1d4ed8" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">Account Required</Text>
        <Text className="text-base text-gray-500 text-center mb-8 leading-relaxed">
          Create a free account to message local producers and ask about their harvest.
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

  // NORMAL MESSAGES SCREEN (For Logged In Users)
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