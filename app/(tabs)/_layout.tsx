import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Modal } from 'react-native';
import { Tabs, Redirect, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/components/context/AuthContext'; 
import { Home, Bookmark, Plus, MessageCircle, User, Archive, X, Calendar, Edit3, Store, FileText } from 'lucide-react-native';
import { supabase } from '@/lib/supabase'; 

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { userMode } = useAuth(); 

  if (!userMode) {
    return <Redirect href="/login" />;
  }
  
  const role = userMode ?? 'consumer';

  const [showGlobalAddModal, setShowGlobalAddModal] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let channel: any = null;

    async function checkUnreadBadge() {
      const { data: { session } } = await supabase.auth.getSession();

      // APPLE REVIEWER FIX: Skip badge check if the user is an anonymous guest
      if (!session?.user?.id || session.user.is_anonymous || !isMounted) return;
      
      const userId = session.user.id;

      let targetConversationIds: string[] = [];
      if (role === 'producer') {
        const { data: myFarm } = await supabase.from('farm_members').select('farm_id').eq('user_id', userId).maybeSingle();
        if (myFarm) {
          const { data: convos } = await supabase.from('conversations').select('id').eq('farm_id', myFarm.farm_id);
          if (convos) targetConversationIds = convos.map(c => c.id);
        }
      } else {
        const { data: convos } = await supabase.from('conversations').select('id').eq('consumer_id', userId);
        if (convos) targetConversationIds = convos.map(c => c.id);
      }

      if (targetConversationIds.length === 0) {
        if (isMounted) setHasUnreadMessages(false);
        return;
      }

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', userId)
        .in('conversation_id', targetConversationIds);

      if (isMounted) setHasUnreadMessages(count ? count > 0 : false);
    }

    checkUnreadBadge();

    supabase.auth.getSession().then(({ data: { session } }) => {
      // Don't subscribe to sockets if it's a guest
      if (!session?.user?.id || session.user.is_anonymous || !isMounted) return;
      const userId = session.user.id;

      channel = supabase.channel(`global_badge_${userId}_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
           checkUnreadBadge();
        })
        .subscribe();
    });

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [role]);

  const AddActionButton = ({ Icon, label, onPress }: any) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => {
        onPress();
        setShowGlobalAddModal(false);
      }}
      className="flex-row items-center p-3.5 bg-white rounded-3xl border border-gray-100 shadow-sm"
    >
      <View className="flex-row items-center gap-3.5 flex-1 pr-4">
        <View className="w-11 h-11 bg-[#eff6ff] rounded-2xl items-center justify-center border border-blue-100">
           <Icon size={22} color="#1d4ed8" />
        </View>
        <Text className="text-base font-bold text-black">{label}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }} className="flex-1">
      <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#1d4ed8' }}>
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home color={color} size={24} /> }} />
        <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarIcon: ({ color }) => <Bookmark color={color} size={24} /> }} />
        
        <Tabs.Screen 
          name="add" 
          options={{ 
            title: 'Add',
            ...(role === 'consumer' 
              ? { href: null } 
              : { 
                  tabBarButton: (props) => (
                    <TouchableOpacity activeOpacity={0.7} onPress={() => setShowGlobalAddModal(true)} className="flex-1 items-center justify-center pt-2">
                      <Plus size={24} color={showGlobalAddModal ? "#1d4ed8" : "#888"} />
                      <Text className={`text-[10px] mt-1 ${showGlobalAddModal ? 'text-blue-700' : 'text-gray-500'}`}>Add</Text>
                    </TouchableOpacity>
                  )
                }
            )
          }} 
        />
        
        <Tabs.Screen 
          name="messages" 
          options={{ 
            title: 'Messages', 
            tabBarIcon: ({ color }) => (
              <View style={{ position: 'relative' }}>
                <MessageCircle color={color} size={24} />
                {hasUnreadMessages && (
                  <View style={{ position: 'absolute', top: -2, right: -4, width: 10, height: 10, backgroundColor: '#ef4444', borderRadius: 5, borderWidth: 2, borderColor: 'white' }} />
                )}
              </View>
            ) 
          }} 
        />
        
        <Tabs.Screen name="pantry" options={{ title: 'Pantry', href: role === 'consumer' ? '/(tabs)/pantry' : null, tabBarIcon: ({ color }) => <Archive color={color} size={24} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', href: (role === 'producer' || role === 'admin') ? '/(tabs)/profile' : null, tabBarIcon: ({ color }) => <User color={color} size={24} /> }} />
      </Tabs>

      <Modal visible={showGlobalAddModal} transparent animationType="slide" onRequestClose={() => setShowGlobalAddModal(false)}>
         <TouchableOpacity activeOpacity={1} onPress={() => setShowGlobalAddModal(false)} className="flex-1 justify-end">
            <View className="bg-white rounded-t-3xl pb-10 w-full" style={{ paddingBottom: Math.max(insets.bottom, 24), shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10 }}>
               <View className="flex-row items-center justify-between p-6 border-b border-gray-100">
                  <Text className="text-xl font-bold text-black">Create New</Text>
                  <TouchableOpacity onPress={() => setShowGlobalAddModal(false)} className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
                     <X size={18} color="#374151" />
                  </TouchableOpacity>
               </View>
               
               <View className="p-5 gap-3">
                  <AddActionButton Icon={Plus} label="New Product" onPress={() => router.push('/new-product')} />
                  <AddActionButton Icon={Edit3} label="New Update Post" onPress={() => router.push('/new-update')} />
                  <AddActionButton Icon={Calendar} label="New Event" onPress={() => router.push('/new-event')} />
                  
                  {role === 'admin' && <View className="h-[1px] bg-gray-100 my-1" />}
                  {role === 'admin' && <AddActionButton Icon={Store} label="New Farm Profile" onPress={() => router.push('/new-farm')} />}
                  {role === 'admin' && <AddActionButton Icon={FileText} label="New Featured Article" onPress={() => router.push('/new-article')} />}
               </View>
            </View>
         </TouchableOpacity>
      </Modal>
    </View>
  );
}