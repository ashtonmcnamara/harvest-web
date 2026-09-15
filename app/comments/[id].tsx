import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ChevronLeft, Send } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function CommentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams(); 
  
  const [comments, setComments] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    async function fetchComments() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('update_comments')
          .select('*, profiles(first_name, last_name, avatar_url)')
          .eq('update_id', id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (data) setComments(data);
      } catch (error) {
        console.error("Error fetching comments", error);
      } finally {
        setLoading(false);
      }
    }
    fetchComments();

    const channel = supabase.channel('realtime_comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'update_comments', filter: `update_id=eq.${id}` }, 
      async (payload) => {
        const { data: profileData } = await supabase.from('profiles').select('first_name, last_name, avatar_url').eq('id', payload.new.user_id).single();
        const newComment = { ...payload.new, profiles: profileData };
        // We only append it if it doesn't already exist (to prevent duplicates from the optimistic update)
        setComments(prev => {
          if (prev.find(c => c.id === newComment.id)) return prev;
          return [...prev, newComment];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const postComment = async () => {
    if (!inputText.trim()) return;
    
    const content = inputText.trim();
    setInputText(''); 

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      // Optimistic UI: Inject the comment instantly!
      const { data: profileData } = await supabase.from('profiles').select('first_name, last_name, avatar_url').eq('id', session.user.id).single();
      const tempId = Math.random().toString();
      const optimisticComment = {
        id: tempId,
        content: content,
        profiles: profileData
      };
      setComments(prev => [...prev, optimisticComment]);

      // Scroll to bottom immediately
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

      // Save to database
      await supabase.from('update_comments').insert({
        update_id: id,
        user_id: session.user.id,
        content: content
      });
    } catch (error) {
      console.error("Post comment error:", error);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#white' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="flex-row items-center px-4 pb-4 border-b border-gray-100 bg-white" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={28} color="#333" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-black ml-2">Comments</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1d4ed8" className="mt-10" />
      ) : (
        <ScrollView 
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          className="flex-1 px-5 bg-white" 
          showsVerticalScrollIndicator={false}
        >
          {comments.length === 0 ? (
            <Text className="text-gray-500 text-center mt-10">No comments yet. Be the first!</Text>
          ) : (
            <View className="py-4 gap-6">
              {comments.map((comment) => (
                <View key={comment.id} className="flex-row items-start">
                  <View className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                    {comment.profiles?.avatar_url ? (
                      <Image source={{ uri: comment.profiles.avatar_url }} className="w-full h-full" />
                    ) : (
                      <View className="w-full h-full bg-blue-50 items-center justify-center"><Text>👤</Text></View>
                    )}
                  </View>
                  <View className="flex-1 bg-[#F9FAFB] p-3 rounded-2xl rounded-tl-none border border-gray-100">
                    <Text className="text-sm font-bold text-black mb-1">
                      {`${comment.profiles?.first_name || 'HarvestNS'} ${comment.profiles?.last_name || 'User'}`}
                    </Text>
                    <Text className="text-base text-gray-800 leading-5">{comment.content}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <View className="px-4 py-3 bg-white border-t border-gray-100 flex-row items-end gap-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <View className="flex-1 bg-[#f8fafc] border border-gray-200 rounded-3xl px-4 min-h-[44px] justify-center py-2.5">
          <TextInput 
            placeholder="Add a comment..." 
            placeholderTextColor="#9ca3af" 
            className="text-base text-black"
            value={inputText}
            onChangeText={setInputText}
            multiline={true}
            style={{ paddingTop: 0, paddingBottom: 0, textAlignVertical: 'center', maxHeight: 100 }}
          />
        </View>
        <TouchableOpacity 
          onPress={postComment}
          disabled={!inputText.trim()}
          className={`w-11 h-11 rounded-full items-center justify-center mb-0.5 ${inputText.trim() ? 'bg-[#1d4ed8]' : 'bg-blue-300'}`}
        >
          <Send size={18} color="white" style={{ marginLeft: -2, marginTop: 2 }} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}