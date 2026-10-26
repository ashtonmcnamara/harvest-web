import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Image } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Package, Calendar, MessageSquare, LogOut, Settings as SettingsIcon, Smartphone, Plus, Pencil, ChevronRight } from 'lucide-react-native';

import HomeFeed from '@/components/home/HomeFeed';
import SettingsModal from '@/components/home/SettingsModal';

// --- INVENTORY TAB COMPONENT ---
const DashboardInventory = ({ farmId, isAdmin }: { farmId: string, isAdmin: boolean }) => {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function loadProducts() {
        let query = supabase.from('products').select('*');
        if (!isAdmin) query = query.eq('farm_id', farmId);
        
        const { data } = await query;
        if (data) setProducts(data);
        setLoading(false);
      }
      loadProducts();
    }, [farmId, isAdmin])
  );

  if (loading) return <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 40 }} />;

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between mb-8">
        <Text className="text-3xl font-bold text-gray-900">Inventory {isAdmin && "(All Farms)"}</Text>
        <TouchableOpacity onPress={() => router.push('/new-product')} className="flex-row items-center bg-[#1d4ed8] px-4 py-2.5 rounded-xl shadow-sm">
          <Plus size={18} color="white" />
          <Text className="text-white font-bold text-base ml-2">Add Product</Text>
        </TouchableOpacity>
      </View>
      
      {products.length === 0 ? (
        <View className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm items-center justify-center">
          <Text className="text-gray-500 text-lg">No products listed yet.</Text>
        </View>
      ) : (
        <View className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {products.map((product, index) => (
            <TouchableOpacity 
              key={product.id}
              onPress={() => router.push(`/edit-product?id=${product.id}`)} 
              className={`flex-row items-center p-5 hover:bg-gray-50 transition-colors ${index !== products.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <View className="w-12 h-12 bg-[#F1F5F9] rounded-xl items-center justify-center border border-gray-200 shadow-sm mr-4">
                <Text className="text-2xl">{product.image_url}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-black">{product.name}</Text>
                <Text className="text-sm text-gray-500">{product.category} • {product.price}</Text>
              </View>
              <Pencil size={18} color="#64748b" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// --- EVENTS TAB COMPONENT ---
const DashboardEvents = ({ farmId, isAdmin }: { farmId: string, isAdmin: boolean }) => {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function loadEvents() {
        let query = supabase.from('events').select('*').order('start_time', { ascending: true });
        if (!isAdmin) query = query.eq('farm_id', farmId);
        
        const { data } = await query;
        if (data) setEvents(data);
        setLoading(false);
      }
      loadEvents();
    }, [farmId, isAdmin])
  );

  if (loading) return <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 40 }} />;

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between mb-8">
        <Text className="text-3xl font-bold text-gray-900">Events {isAdmin && "(All Farms)"}</Text>
        <TouchableOpacity onPress={() => router.push('/new-event')} className="flex-row items-center bg-[#1d4ed8] px-4 py-2.5 rounded-xl shadow-sm">
          <Plus size={18} color="white" />
          <Text className="text-white font-bold text-base ml-2">Add Event</Text>
        </TouchableOpacity>
      </View>
      
      {events.length === 0 ? (
        <View className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm items-center justify-center">
          <Text className="text-gray-500 text-lg">No events scheduled.</Text>
        </View>
      ) : (
        <View className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {events.map((event, index) => {
            const dateObj = new Date(event.start_time);
            return (
              <TouchableOpacity 
                key={event.id}
                onPress={() => router.push(`/edit-event?id=${event.id}`)} 
                className={`flex-row items-center p-5 hover:bg-gray-50 transition-colors ${index !== events.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <View className="w-12 h-12 bg-[#eff6ff] rounded-xl items-center justify-center border border-blue-100 shadow-sm mr-4">
                  <Calendar size={24} color="#1d4ed8" />
                </View>
                <View className="flex-1 pr-4">
                  <Text className="text-lg font-bold text-black">{event.title}</Text>
                  <Text className="text-sm text-gray-500">
                    {dateObj.toLocaleDateString()} • {event.location || 'Location TBD'}
                  </Text>
                </View>
                <Pencil size={18} color="#64748b" />
              </TouchableOpacity>
            )
          })}
        </View>
      )}
    </View>
  );
};

// --- MESSAGES TAB COMPONENT ---
const DashboardMessages = ({ farmId, isAdmin }: { farmId: string, isAdmin: boolean }) => {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function loadConversations() {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) return;

          const { data: blockedData } = await supabase.from('blocked_users').select('blocked_id').eq('blocker_id', session.user.id);
          const blockedIds = new Set(blockedData?.map((b: any) => b.blocked_id) || []);

          let query = supabase.from('conversations').select('id, updated_at, consumer_id, farms(id, name, avatar_url)').order('updated_at', { ascending: false });
          if (!isAdmin) query = query.eq('farm_id', farmId);
          
          const { data: convos } = await query;

          if (convos) {
            const formatted = (await Promise.all(convos.map(async (c: any) => {
              if (blockedIds.has(c.consumer_id)) return null;

              const { data: lastMsg } = await supabase.from('messages')
                .select('content, created_at, sender_id, is_read')
                .eq('conversation_id', c.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

              if (lastMsg && blockedIds.has(lastMsg.sender_id)) return null;

              let displayName = 'HarvestNS User';
              let displayAvatar = null;
              let isAdminChat = false;

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

              const hasUnread = lastMsg ? (lastMsg.sender_id !== session.user.id && !lastMsg.is_read) : false;

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

              return { id: c.id, displayName, displayAvatar, isAdminChat, lastMessage: lastMsg ? lastMsg.content : 'No messages yet.', time: timeString, hasUnread };
            }))).filter(Boolean);
            setConversations(formatted);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
      loadConversations();
    }, [farmId, isAdmin])
  );

  if (loading) return <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 40 }} />;

  return (
    <View className="flex-1">
      <Text className="text-3xl font-bold text-gray-900 mb-8">Messages {isAdmin && "(All Farms)"}</Text>
      
      {conversations.length === 0 ? (
        <View className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm items-center justify-center">
          <Text className="text-gray-500 text-lg">No conversations yet.</Text>
        </View>
      ) : (
        <View className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {conversations.map((convo, index) => (
            <TouchableOpacity 
              key={convo.id} 
              onPress={() => router.push(`/message/${convo.id}`)}
              className={`flex-row items-center p-5 hover:bg-gray-50 transition-colors ${index !== conversations.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <View className="mr-4 relative">
                <View className="w-14 h-14 bg-gray-100 rounded-full border border-gray-200 overflow-hidden items-center justify-center">
                  {convo.isAdminChat ? (
                    <Image source={require('@/assets/images/logo-icon.png')} className="w-full h-full" resizeMode="contain" />
                  ) : convo.displayAvatar ? (
                    <Image source={{ uri: convo.displayAvatar }} className="w-full h-full" />
                  ) : (
                    <Text className="text-2xl">👤</Text>
                  )}
                </View>
                {convo.hasUnread && <View className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#1d4ed8] rounded-full border-2 border-white z-10" />}
              </View>

              <View className="flex-1 pr-4">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-lg font-bold text-black">{convo.displayName}</Text>
                  <Text className={`text-sm ${convo.hasUnread ? 'text-[#1d4ed8] font-bold' : 'text-gray-500'}`}>{convo.time}</Text>
                </View>
                <Text className={`text-base ${convo.hasUnread ? 'text-black font-semibold' : 'text-gray-500'}`} numberOfLines={1}>
                  {convo.lastMessage}
                </Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};


// --- MAIN DASHBOARD COMPONENT ---
export default function WebDashboard() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  
  const [activeTab, setActiveTab] = useState((params.tab as string) || 'overview');
  const [loading, setLoading] = useState(true);
  
  const [farmName, setFarmName] = useState('My Farm');
  const [farmId, setFarmId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (params.tab && typeof params.tab === 'string') {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      router.replace('/(tabs)');
      return;
    }
    
    async function initDashboard() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        
        // CHECK ROLE FIRST
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        
        if (profile?.role === 'admin') {
          setIsAdmin(true);
          setFarmName('HarvestNS Admin');
          setFarmId('admin_bypass'); // Bypasses the null check in the renderer
        } else {
          // NORMAL PRODUCER LOGIC
          const { data: member } = await supabase.from('farm_members').select('farm_id, farms(name)').eq('user_id', session.user.id).single();
          if (member) {
            setFarmId(member.farm_id);
            if (member.farms) {
              setFarmName(Array.isArray(member.farms) ? member.farms[0].name : member.farms.name);
            }
          }
        }
      }
      setLoading(false);
    }
    initDashboard();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setTimeout(() => router.replace('/login'), 100);
  };

  const NavItem = ({ id, icon: Icon, label }: any) => (
    <TouchableOpacity 
      onPress={() => router.setParams({ tab: id })} 
      className={`flex-row items-center p-3 rounded-xl mb-2 ${activeTab === id ? 'bg-blue-50' : 'hover:bg-gray-50 transition-colors'}`}
    >
      <Icon size={20} color={activeTab === id ? '#1d4ed8' : '#64748b'} />
      <Text className={`ml-3 font-semibold text-base ${activeTab === id ? 'text-blue-700' : 'text-slate-500'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <View className="flex-1 items-center justify-center bg-gray-50"><ActivityIndicator size="large" color="#1d4ed8" /></View>;
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row', height: '100vh', width: '100vw' }} className="bg-gray-50 overflow-hidden">
      
      {/* Sidebar Navigation */}
      <View style={{ width: 280 }} className="bg-white border-r border-gray-200 p-6 justify-between h-full shadow-sm z-10">
        <View>
          <Text className="text-2xl font-bold text-black mb-8" numberOfLines={1}>{farmName}</Text>
          
          <NavItem id="overview" icon={LayoutDashboard} label="Live Feed" />
          <NavItem id="products" icon={Package} label="Inventory" />
          <NavItem id="events" icon={Calendar} label="Events" />
          <NavItem id="messages" icon={MessageSquare} label="Messages" />
        </View>

        <View className="gap-2">
          {/* Switch to Mobile View Button */}
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} className="flex-row items-center p-3 hover:bg-gray-50 rounded-xl transition-colors mb-2">
            <Smartphone size={20} color="#64748b" />
            <Text className="ml-3 font-semibold text-base text-slate-500">Switch to Mobile View</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setShowSettings(true)} className="flex-row items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
            <SettingsIcon size={20} color="#64748b" />
            <Text className="ml-3 font-semibold text-base text-slate-500">Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleLogout} className="flex-row items-center p-3 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut size={20} color="#ef4444" />
            <Text className="ml-3 font-semibold text-base text-red-500">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={{ flex: 1 }} className="h-full bg-[#F8FAFC]">
        {activeTab === 'overview' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24 }}>
            <View style={{ width: '100%', maxWidth: 448, height: '100%', borderRadius: 32, overflow: 'hidden' }} className="bg-white shadow-2xl border border-gray-200">
              <HomeFeed />
            </View>
          </View>
        )}

        {activeTab === 'products' && (
          <ScrollView className="flex-1 px-10 py-12" showsVerticalScrollIndicator={false}>
            {farmId ? <DashboardInventory farmId={farmId} isAdmin={isAdmin} /> : <Text>No farm linked.</Text>}
          </ScrollView>
        )}
        
        {activeTab === 'events' && (
          <ScrollView className="flex-1 px-10 py-12" showsVerticalScrollIndicator={false}>
            {farmId ? <DashboardEvents farmId={farmId} isAdmin={isAdmin} /> : <Text>No farm linked.</Text>}
          </ScrollView>
        )}

        {activeTab === 'messages' && (
          <ScrollView className="flex-1 px-10 py-12" showsVerticalScrollIndicator={false}>
            {farmId ? <DashboardMessages farmId={farmId} isAdmin={isAdmin} /> : <Text>No farm linked.</Text>}
          </ScrollView>
        )}
      </View>
      
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
    </View>
  );
}