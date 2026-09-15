import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ChevronLeft, Send, Heart, MoreVertical } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/context/AuthContext';

export default function ChatRoom() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { userMode } = useAuth();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // NEW: Store the actual underlying User ID of whoever we are talking to so we can block them!
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const [chatName, setChatName] = useState('Loading...');
  const [chatAvatar, setChatAvatar] = useState<string | null>(null);

  const lastTapRef = useRef<{ id: string, time: number } | null>(null);

  useEffect(() => {
    if (!id) return;

    async function loadChat() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      const userId = session.user.id;
      setCurrentUserId(userId);

      const { data: convo } = await supabase.from('conversations').select('consumer_id, farm_id, farms(id, name, avatar_url)').eq('id', id).single();
      if (convo) {
        if (userMode === 'producer') {
          // We are talking to a Consumer. Their target ID is simply the consumer_id.
          setTargetUserId(convo.consumer_id);
          const { data: profile } = await supabase.from('profiles').select('first_name, last_name, avatar_url').eq('id', convo.consumer_id).single();
          if (profile) {
            setChatName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'HarvestNS User');
            setChatAvatar(profile.avatar_url);
          }
        } else {
          // We are talking to a Farm. We must fetch the actual User ID of the farm owner to block them!
          const { data: fm } = await supabase.from('farm_members').select('user_id').eq('farm_id', convo.farm_id).single();
          if (fm) setTargetUserId(fm.user_id);

          const farmObj = Array.isArray(convo.farms) ? convo.farms[0] : convo.farms;
          setChatName(farmObj?.name || 'Farm');
          setChatAvatar(farmObj?.avatar_url);
        }
      }

      const { data: msgs } = await supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true });
      if (msgs) setMessages(msgs);

      await supabase.from('messages').update({ is_read: true }).eq('conversation_id', id).neq('sender_id', userId).eq('is_read', false);
    }
    loadChat();

    const channel = supabase.channel('realtime_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, 
      (payload) => {
        setMessages(prev => [...prev, payload.new]);
        if (payload.new.sender_id !== currentUserId) {
           supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id).then();
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, 
      (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, userMode, currentUserId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !currentUserId) return;
    const content = inputText.trim();
    setInputText(''); 
    try {
      await supabase.from('messages').insert({ conversation_id: id, sender_id: currentUserId, content: content });
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', id);
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  const handleMessageTap = async (msgId: string, currentLikeStatus: boolean) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300; 
    
    if (lastTapRef.current && lastTapRef.current.id === msgId && (now - lastTapRef.current.time) < DOUBLE_PRESS_DELAY) {
      try {
        const newStatus = !currentLikeStatus;
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_liked: newStatus } : m));
        await supabase.from('messages').update({ is_liked: newStatus }).eq('id', msgId);
      } catch (e) {}
    } else {
      lastTapRef.current = { id: msgId, time: now };
    }
  };

  const handleReportUser = () => {
    Alert.alert(
      "Content Options",
      "Please select an action for this user.",
      [
        { 
          text: "Report User", 
          style: "destructive", 
          onPress: async () => {
             if (currentUserId) {
                await supabase.from('reports').insert({ reporter_id: currentUserId, reported_id: targetUserId || id, item_type: 'chat_user', reason: 'Flagged by user' });
             }
             Alert.alert("Reported", "This user has been flagged for review by HarvestNS admins.");
          } 
        },
        { 
          text: "Block User", 
          style: "destructive", 
          onPress: async () => {
             if (currentUserId && targetUserId) {
                await supabase.from('blocked_users').insert({ blocker_id: currentUserId, blocked_id: targetUserId });
             }
             Alert.alert("Blocked", "You will no longer receive messages from this user.");
             router.back(); // Kicks them out of the chat instantly!
          } 
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F9FAFB' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      
      <View className="flex-row items-center px-4 pb-4 border-b border-gray-200 bg-white" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={28} color="#1d4ed8" />
        </TouchableOpacity>
        <View className="w-10 h-10 bg-gray-100 rounded-full mx-3 border border-gray-200 overflow-hidden">
          {chatAvatar ? <Image source={{ uri: chatAvatar }} className="w-full h-full" /> : <View className="w-full h-full bg-blue-50 items-center justify-center"><Text className="text-lg">👤</Text></View>}
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-black">{chatName}</Text>
        </View>
        <TouchableOpacity onPress={handleReportUser} className="p-2 -mr-2">
          <MoreVertical size={24} color="#888" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        className="flex-1 px-4" 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingVertical: 20 }}
      >
        {messages.map((msg, index) => {
          const isMine = msg.sender_id === currentUserId;
          return (
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => handleMessageTap(msg.id, msg.is_liked)}
              key={msg.id || index} 
              className={`mb-4 max-w-[80%] ${isMine ? 'self-end' : 'self-start'} relative`}
            >
              <View className={`px-4 py-3 rounded-2xl ${isMine ? 'bg-[#1d4ed8] rounded-tr-sm' : 'bg-[#f1f5f9] border border-gray-200 rounded-tl-sm'}`}>
                <Text className={`text-base leading-5 ${isMine ? 'text-white' : 'text-black'}`}>{msg.content}</Text>
              </View>
              {msg.is_liked && (
                <View className={`absolute -bottom-2 ${isMine ? 'left-2' : 'right-2'} bg-white rounded-full p-1 border border-gray-200 shadow-sm`}>
                  <Heart size={12} color="#ef4444" fill="#ef4444" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View className="px-4 py-3 bg-white border-t border-gray-200 flex-row items-end gap-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <View className="flex-1 bg-[#f8fafc] border border-gray-200 rounded-3xl px-4 min-h-[44px] justify-center py-2.5">
          <TextInput 
            placeholder="Message..." 
            placeholderTextColor="#9ca3af" 
            className="text-base text-black"
            value={inputText}
            onChangeText={setInputText}
            multiline={true}
            style={{ paddingTop: 0, paddingBottom: 5, textAlignVertical: 'center', maxHeight: 100 }}
          />
        </View>
        <TouchableOpacity onPress={sendMessage} disabled={!inputText.trim()} className={`w-11 h-11 rounded-full items-center justify-center mb-0.5 ${inputText.trim() ? 'bg-[#1d4ed8]' : 'bg-blue-300'}`}>
          <Send size={18} color="white" style={{ marginLeft: -2, marginTop: 2 }} />
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
}