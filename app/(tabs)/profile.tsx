import React, { useState, useCallback, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, Image, Alert, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Text } from '@/components/ui/text';
import { CalendarCheck, CalendarDays, MessageSquare, Store, X, ChevronRight, Calendar, LogOut, Trash2, FileText, Pencil } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/context/AuthContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userMode } = useAuth();
  const role = userMode;

  const [activeModal, setActiveModal] = useState<'rsvps' | 'events' | 'updates' | 'farms' | 'articles' | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [profileName, setProfileName] = useState('User');
  const [myRSVPs, setMyRSVPs] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [myUpdates, setMyUpdates] = useState<any[]>([]);
  const [myArticles, setMyArticles] = useState<any[]>([]);
  const [allFarms, setAllFarms] = useState<any[]>([]);
  const [myFarmId, setMyFarmId] = useState<string | null>(null); 

  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      setLoading(true);

      async function loadProfileData() {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) return;
          const userId = session.user.id;

          const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', userId).single();
          if (profile) setProfileName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'HarvestNS User');

          const { data: rsvpData } = await supabase.from('event_rsvps').select('events(*)').eq('user_id', userId);
          if (rsvpData) setMyRSVPs(rsvpData.map((r: any) => ({ id: r.events.id, title: r.events.title, date: new Date(r.events.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })));

          const { data: eventsData } = await supabase.from('events').select('*').eq('author_id', userId);
          if (eventsData) setMyEvents(eventsData.map(e => ({ id: e.id, title: e.title, date: new Date(e.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })));

          const { data: updatesData } = await supabase.from('updates').select('*').eq('author_id', userId).order('created_at', { ascending: false });
          if (updatesData) setMyUpdates(updatesData.map(u => ({ id: u.id, content: u.content, time: new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })));

          if (role === 'admin') {
            const { data: farmsData } = await supabase.from('farms').select('*').order('name');
            if (farmsData) setAllFarms(farmsData);

            const { data: articlesData } = await supabase.from('articles').select('*');
            if (articlesData) setMyArticles(articlesData);

          } else if (role === 'producer') {
            const { data: myFarmData } = await supabase.from('farm_members').select('farm_id').eq('user_id', userId).single();
            if (myFarmData) setMyFarmId(myFarmData.farm_id);
          }

        } catch (error) {
          console.error("Error loading profile data:", error);
        } finally {
          setLoading(false);
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        }
      }
      loadProfileData();
    }, [role, fadeAnim])
  );

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive', 
        onPress: async () => { 
          await supabase.auth.signOut(); 
          setTimeout(() => {
            router.replace('/login'); 
          }, 100);
        } 
      }
    ]);
  };

  const handleFarmAction = () => {
    if (role === 'admin') setActiveModal('farms');
    else if (role === 'producer') {
      if (myFarmId) router.push(`/farm/${myFarmId}`);
      else Alert.alert("No Farm", "You have not been assigned to a farm yet.");
    }
  };

  const handleDeleteUpdate = async (id: string) => {
    Alert.alert('Delete Update', 'Are you sure you want to permanently delete this update?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await supabase.from('updates').delete().eq('id', id); setMyUpdates(prev => prev.filter(u => u.id !== id)); } catch (e) {} } }
    ]);
  };

  const handleDeleteArticle = async (id: string) => {
    Alert.alert('Delete Article', 'Are you sure you want to remove this featured article?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await supabase.from('articles').delete().eq('id', id); setMyArticles(prev => prev.filter(a => a.id !== id)); } catch (e) {} } }
    ]);
  };

  const GridButton = ({ title, icon: Icon, onPress, count }: any) => (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={onPress} 
      // FIX 1: Explicit inline styles guarantee the 2x2 grid works correctly
      style={{ width: '48%', aspectRatio: 1, marginBottom: 16 }}
      className="bg-[#F1F5F9] rounded-3xl p-5 border border-gray-200/60 shadow-sm justify-between"
    >
      <View className="w-12 h-12 bg-white rounded-full items-center justify-center border border-gray-100"><Icon size={24} color="#1d4ed8" /></View>
      <View>
        <Text className="text-lg font-bold text-gray-900 leading-tight">{title}</Text>
        {count !== undefined && <Text className="text-sm font-semibold text-blue-700 mt-1">{count} total</Text>}
      </View>
    </TouchableOpacity>
  );

  const getModalTitle = () => {
    if (activeModal === 'rsvps') return "RSVP'd Events";
    if (activeModal === 'events') return "My Events";
    if (activeModal === 'updates') return "My Updates";
    if (activeModal === 'farms') return "Farm Directory";
    if (activeModal === 'articles') return "Featured Articles";
    return "";
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-start justify-between px-5 pb-4 border-b border-gray-100 bg-white" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <View>
          <Text className="text-2xl font-bold text-black mb-1">Management</Text>
          <Text className="text-sm text-gray-500 font-medium">Logged in as: <Text className="text-[#1d4ed8] font-bold">{profileName}</Text></Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} className="p-2 bg-gray-50 rounded-full border border-gray-200">
          <LogOut size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="h-64" />
        ) : (
          <Animated.View 
            // FIX 2: Explicit flexbox styles for the Animated View wrapper
            style={{ opacity: fadeAnim, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 32 }} 
          >
            <GridButton title="RSVP'd Events" icon={CalendarCheck} count={myRSVPs.length} onPress={() => setActiveModal('rsvps')} />
            {role !== 'consumer' && <GridButton title="My Events" icon={CalendarDays} count={myEvents.length} onPress={() => setActiveModal('events')} />}
            {role !== 'consumer' && <GridButton title="My Updates" icon={MessageSquare} count={myUpdates.length} onPress={() => setActiveModal('updates')} />}
            {role !== 'consumer' && <GridButton title={role === 'admin' ? "Farm Directory" : "My Farm Profile"} icon={Store} onPress={handleFarmAction} count={role === 'admin' ? allFarms.length : undefined} />}
            {role === 'admin' && <GridButton title="Featured Articles" icon={FileText} count={myArticles.length} onPress={() => setActiveModal('articles')} />}
          </Animated.View>
        )}
      </ScrollView>

      {/* DYNAMIC LIST MODAL */}
      <Modal visible={activeModal !== null} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        {/* FIX 3: Explicit max-width for web modal centering */}
        <View style={{ flex: 1, width: '100%', maxWidth: 448, alignSelf: 'center', height: '100%' }} className="bg-white shadow-2xl">
          <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100" style={{ paddingTop: Math.max(insets.top, 16) }}>
            <TouchableOpacity onPress={() => setActiveModal(null)} className="w-10 h-10 items-center justify-center -ml-2"><X size={24} color="#000" /></TouchableOpacity>
            <Text className="text-xl font-bold text-black">{getModalTitle()}</Text>
            <View className="w-10" />
          </View>
          <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
            <View className="gap-4 pb-10">
              
              {(activeModal === 'rsvps' || activeModal === 'events') ? (
                (activeModal === 'rsvps' ? myRSVPs : myEvents).map(event => (
                  <TouchableOpacity key={event.id} onPress={() => { setActiveModal(null); router.push(`/event/${event.id}`); }} className="bg-[#F1F5F9] border border-gray-200/60 rounded-3xl p-4 flex-row items-center shadow-sm">
                    <View className="w-14 h-14 bg-white rounded-2xl items-center justify-center mr-4 shadow-sm border border-gray-100"><Calendar size={24} color="#1d4ed8" /></View>
                    <View className="flex-1 pr-4">
                      <Text className="text-base font-bold text-black mb-1">{event.title}</Text>
                      <Text className="text-sm font-semibold text-[#1d4ed8]">{event.date}</Text>
                    </View>
                    <ChevronRight size={20} color="#9ca3af" />
                  </TouchableOpacity>
                ))
              ) : null}

              {activeModal === 'updates' ? (
                myUpdates.map(update => (
                  <View key={update.id} className="bg-[#F1F5F9] border border-gray-200/60 rounded-3xl p-5 shadow-sm mb-2">
                    <View className="flex-row justify-between items-start mb-2">
                        <Text className="text-sm text-gray-500 font-semibold">{update.time}</Text>
                        <TouchableOpacity onPress={() => handleDeleteUpdate(update.id)} className="p-1"><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
                    </View>
                    <Text className="text-base text-gray-800 leading-6">{update.content}</Text>
                  </View>
                ))
              ) : null}

              {activeModal === 'articles' ? (
                myArticles.map(article => (
                  <View key={article.id} className="bg-[#F1F5F9] border border-gray-200/60 rounded-3xl p-5 shadow-sm mb-2">
                    <View className="flex-row justify-between items-start mb-2">
                        <Text className="text-sm text-blue-600 font-medium flex-1 mr-4" numberOfLines={1}>{article.url}</Text>
                        <View className="flex-row items-center gap-2">
                          <TouchableOpacity onPress={() => { setActiveModal(null); router.push(`/edit-article/${article.id}`); }} className="p-1.5 bg-blue-50 border border-blue-100 rounded-full"><Pencil size={16} color="#1d4ed8" /></TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteArticle(article.id)} className="p-1.5 bg-red-50 border border-red-100 rounded-full"><Trash2 size={16} color="#ef4444" /></TouchableOpacity>
                        </View>
                    </View>
                    <Text className="text-base font-bold text-gray-900 leading-6">{article.title}</Text>
                  </View>
                ))
              ) : null}

              {activeModal === 'farms' ? (
                allFarms.map(farm => (
                  <TouchableOpacity key={farm.id} onPress={() => { setActiveModal(null); router.push(`/farm/${farm.id}`); }} className="bg-[#F1F5F9] border border-gray-200/60 rounded-3xl p-4 flex-row items-center shadow-sm">
                    <View className="w-14 h-14 bg-white rounded-2xl mr-4 overflow-hidden border border-gray-100 shadow-sm items-center justify-center">
                       {farm.avatar_url ? <Image source={{ uri: farm.avatar_url }} className="w-full h-full bg-[#F1F5F9]" /> : <Text>🚜</Text>}
                    </View>
                    <View className="flex-1 pr-4">
                      <Text className="text-base font-bold text-black mb-0.5">{farm.name}</Text>
                      <Text className="text-sm text-gray-500 font-medium">{farm.location_address || 'Nova Scotia'}</Text>
                    </View>
                    <ChevronRight size={20} color="#9ca3af" />
                  </TouchableOpacity>
                ))
              ) : null}

              {activeModal === 'rsvps' && myRSVPs.length === 0 && <Text className="text-gray-500 text-center mt-5">No RSVPs yet.</Text>}
              {activeModal === 'events' && myEvents.length === 0 && <Text className="text-gray-500 text-center mt-5">You haven't posted any events.</Text>}
              {activeModal === 'updates' && myUpdates.length === 0 && <Text className="text-gray-500 text-center mt-5">You haven't posted any updates.</Text>}
              {activeModal === 'articles' && myArticles.length === 0 && <Text className="text-gray-500 text-center mt-5">No articles published.</Text>}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}