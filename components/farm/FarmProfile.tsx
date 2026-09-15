import React, { useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Modal, ActivityIndicator, Alert, Share as NativeShare, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'; 
import { Text } from '@/components/ui/text';
// FIXED: Swapped brand icons for the safe Link icon
import { ChevronLeft, Share as ShareIcon, Bookmark, BadgeCheck, MessageCircle, Globe, Camera, Pencil, X, MapPin, Calendar, Clock, Truck, Award, Plus, Link as LinkIcon } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/context/AuthContext';
import MapView, { Marker } from 'react-native-maps';

export default function FarmProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter(); 
  const { id } = useLocalSearchParams();
  const { userMode } = useAuth();
  const isAdmin = userMode === 'admin';

  const [activeFarm, setActiveFarm] = useState<any>(null);
  const [farmProducts, setFarmProducts] = useState<any[]>([]);
  const [farmEvents, setFarmEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isOwner, setIsOwner] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activePopup, setActivePopup] = useState<{ title: string; content: string } | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');

  useFocusEffect(
    useCallback(() => {
      if (!id) return;

      async function fetchFarmDetails() {
        setLoading(true);
        try {
          const { data: farmData } = await supabase.from('farms').select('*').eq('id', id).single();
          if (farmData) setActiveFarm(farmData);

          const { data: productData } = await supabase.from('products').select('*').eq('farm_id', id);
          if (productData) setFarmProducts(productData);

          const { data: eventData } = await supabase.from('events').select('*').eq('farm_id', id);
          if (eventData) setFarmEvents(eventData);

          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            const { data: memberData } = await supabase.from('farm_members').select('*').eq('farm_id', id).eq('user_id', session.user.id).maybeSingle();
            if (memberData) setIsOwner(true);

            const { data: savedData } = await supabase.from('saved_farms').select('*').eq('farm_id', id).eq('user_id', session.user.id).maybeSingle();
            if (savedData) setIsSaved(true);
          }
        } catch (error) {
          console.error('Error fetching farm details:', error);
        } finally {
          setLoading(false);
        }
      }

      fetchFarmDetails();
    }, [id])
  );

  const handleSave = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      if (isSaved) {
        await supabase.from('saved_farms').delete().eq('farm_id', id).eq('user_id', session.user.id);
      } else {
        await supabase.from('saved_farms').insert({ farm_id: id, user_id: session.user.id });
      }
      setIsSaved(!isSaved); 
    } catch (error) {}
  };
  
  const handleShare = async () => {
    try {
      await NativeShare.share({ 
        message: `Check out ${activeFarm?.name} on HarvestNS! https://harvestns.com/farm/${id}`,
        url: `https://harvestns.com/farm/${id}` 
      });
    } catch (error) {}
  };

  const handleMessageFarm = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data: existingConv } = await supabase.from('conversations').select('id').eq('farm_id', id).eq('consumer_id', session.user.id).maybeSingle();
      if (existingConv) { router.push(`/message/${existingConv.id}`); return; }

      const { data: newConv, error } = await supabase.from('conversations').insert({ farm_id: id, consumer_id: session.user.id }).select().single();
      if (newConv) router.push(`/message/${newConv.id}`);
    } catch (error) {}
  };

  const handleDeleteFarm = async () => {
    Alert.alert('Delete Farm', 'Are you sure? This will delete the farm, its products, and all associated data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await supabase.from('farms').delete().eq('id', id);
            router.replace('/(tabs)/');
          } catch (error) {}
        }
      }
    ]);
  };

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert("Error", "Could not open the link.");
    } catch (error) {}
  };

  const canEdit = isOwner || isAdmin;
  const filteredProducts = activeFilter === 'All' ? farmProducts : farmProducts.filter((p: any) => p.category === activeFilter);

  if (loading) {
    return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator size="large" color="#1d4ed8" /></View>;
  }

  if (!activeFarm) return null;

  const infoCards = [
    { id: 'hours', title: 'Hours', icon: Clock, content: activeFarm.hours },
    { id: 'delivery', title: 'Delivery & Pickup', icon: Truck, content: activeFarm.delivery_info },
    { id: 'tours', title: 'Farm Tours', icon: MapPin, content: activeFarm.farm_tours },
    { id: 'certs', title: 'Certificates', icon: Award, content: activeFarm.certificates }
  ].filter(card => card.content && card.content.trim() !== '');

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} bounces={false}>
        
        <View className="h-56 relative bg-[#F1F5F9]">
          {activeFarm.cover_image_url ? (
             <Image source={{ uri: activeFarm.cover_image_url }} className="w-full h-full" resizeMode="cover" />
          ) : (
             <View className="w-full h-full bg-[#eff6ff] items-center justify-center"><Camera size={40} color="#9CA3AF" /></View>
          )}
          
          <View className="absolute w-full px-4 flex-row justify-between items-start" style={{ top: Math.max(insets.top, 16) }}>
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center backdrop-blur-md border border-white/20">
              <ChevronLeft size={24} color="white" />
            </TouchableOpacity>
            
            <View className="flex-row gap-3 items-center">
              {isAdmin && (
                <TouchableOpacity onPress={handleDeleteFarm} className="bg-[#ff4d4f] px-3 py-1.5 rounded-full mr-2">
                  <Text className="text-white font-bold text-sm">Delete</Text>
                </TouchableOpacity>
              )}
              {canEdit && (
                <TouchableOpacity onPress={() => router.push(`/edit-farm?id=${id}`)} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center border border-white/20">
                  <Pencil size={18} color="white" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleShare} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center border border-white/20">
                <ShareIcon size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center border border-white/20">
                <Bookmark size={20} color={isSaved ? "#3b82f6" : "white"} fill={isSaved ? "#3b82f6" : "none"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="px-5 pb-12">
          
          <View className="flex-row justify-between items-end mb-4">
            <View className="relative -mt-12">
              <View className="w-24 h-24 bg-white rounded-2xl overflow-hidden border-4 border-white shadow-sm items-center justify-center">
                {activeFarm.avatar_url ? (
                   <Image source={{ uri: activeFarm.avatar_url }} className="w-full h-full bg-[#F1F5F9]" resizeMode="cover" />
                ) : (
                   <View className="w-full h-full bg-gray-50 items-center justify-center"><Text className="text-3xl">🚜</Text></View>
                )}
              </View>
              {canEdit && (
                <TouchableOpacity onPress={() => router.push(`/edit-farm?id=${id}`)} className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#1d4ed8] rounded-full items-center justify-center border-2 border-white shadow-sm">
                  <Pencil size={14} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-2xl font-bold text-black">{activeFarm.name}</Text>
              {activeFarm.is_verified && <BadgeCheck size={20} color="#1d4ed8" />}
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-base text-gray-500 font-medium">@{activeFarm.slug} • {activeFarm.location_address || 'Nova Scotia'}</Text>
            </View>
          </View>

          <View className="flex-row gap-3 mb-8">
            <TouchableOpacity onPress={handleMessageFarm} className="flex-1 flex-row items-center justify-center bg-[#1d4ed8] py-3.5 rounded-2xl gap-2 shadow-sm shadow-blue-200">
              <MessageCircle size={20} color="white" />
              <Text className="text-white font-bold text-base">Message</Text>
            </TouchableOpacity>

            {activeFarm.website_link && (
              <TouchableOpacity onPress={() => openLink(activeFarm.website_link)} className="w-14 h-14 bg-white border border-gray-200 rounded-2xl items-center justify-center shadow-sm">
                <Globe size={22} color="#374151" />
              </TouchableOpacity>
            )}
            
            {activeFarm.social_link && (
              <TouchableOpacity onPress={() => openLink(activeFarm.social_link)} className="w-14 h-14 bg-white border border-gray-200 rounded-2xl items-center justify-center shadow-sm">
                <LinkIcon size={22} color="#374151" />
              </TouchableOpacity>
            )}
          </View>

          <View className="mb-8">
            <Text className="text-xl font-bold text-black mb-3">About</Text>
            <View className="bg-[#F1F5F9] p-4 rounded-3xl border border-gray-100/80">
              <Text className="text-gray-700 text-base leading-6">
                {activeFarm.bio || 'Welcome to our farm! Stay tuned for more updates.'}
              </Text>
            </View>
          </View>

          {(activeFarm.latitude && activeFarm.longitude) && (
            <View className="bg-[#F1F5F9] border border-gray-100/80 overflow-hidden rounded-3xl mb-8">
              <View className="p-5 pb-4 border-b border-gray-200 bg-white">
                <Text className="text-lg font-bold text-black mb-1">Location</Text>
                <Text className="text-gray-700 text-base">{activeFarm.location_address}</Text>
              </View>
              <View className="h-48 w-full">
                <MapView 
                  style={{ flex: 1 }}
                  initialRegion={{ latitude: Number(activeFarm.latitude), longitude: Number(activeFarm.longitude), latitudeDelta: 0.05, longitudeDelta: 0.05 }}
                >
                  <Marker coordinate={{ latitude: Number(activeFarm.latitude), longitude: Number(activeFarm.longitude) }} title={activeFarm.name} />
                </MapView>
              </View>
            </View>
          )}

          {infoCards.length > 0 && (
            <View className="mb-8 gap-3">
              {infoCards.map((card) => {
                const Icon = card.icon; 
                return (
                  <TouchableOpacity 
                    key={card.id} 
                    onPress={() => setActivePopup({ title: card.title, content: card.content })}
                    className="flex-row bg-[#F1F5F9] p-4 rounded-3xl border border-gray-100/80 items-start gap-4"
                  >
                    <Icon size={24} color="#374151" />
                    <View className="flex-1">
                      <Text className="text-base font-bold text-black mb-1">{card.title}</Text>
                      <Text className="text-gray-500 text-sm leading-5" numberOfLines={2}>{card.content}</Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-black">Events</Text>
              {canEdit && (
                <TouchableOpacity onPress={() => router.push('/new-event')} className="flex-row items-center bg-[#eff6ff] px-3 py-1.5 rounded-full border border-blue-100">
                  <Plus size={16} color="#1d4ed8" />
                  <Text className="text-[#1d4ed8] font-bold text-sm ml-1">Add Event</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {farmEvents.length === 0 ? (
              <Text className="text-gray-500 italic">No upcoming events listed.</Text>
            ) : (
              <View className="gap-3">
                {farmEvents.map((event: any) => {
                  let safeDate = 'Upcoming';
                  try { if (event.start_time) safeDate = new Date(event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch (e) {}
                  
                  return (
                    <TouchableOpacity 
                      key={event.id}
                      onPress={() => router.push(`/event/${event.id}`)}
                      className="flex-row items-center bg-[#F1F5F9] border border-gray-100/80 rounded-3xl p-4 shadow-sm"
                    >
                      <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center mr-3 border border-gray-200">
                        <Calendar size={20} color="#1d4ed8" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-bold text-black mb-0.5">{event.title}</Text>
                        <Text className="text-sm font-semibold text-[#1d4ed8]">{safeDate}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-black">Products</Text>
              {canEdit && (
                <TouchableOpacity onPress={() => router.push('/new-product')} className="flex-row items-center bg-[#eff6ff] px-3 py-1.5 rounded-full border border-blue-100">
                  <Plus size={16} color="#1d4ed8" />
                  <Text className="text-[#1d4ed8] font-bold text-sm ml-1">Add Product</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {farmProducts.length === 0 ? (
              <Text className="text-gray-500 italic">No products listed yet.</Text>
            ) : (
              <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 -mx-5 px-5">
                  {['All', 'Fruits & Veggies', 'Meat & Poultry', 'Dairy & Eggs', 'Wine'].map(filter => (
                    <TouchableOpacity
                      key={filter}
                      onPress={() => setActiveFilter(filter)}
                      style={[
                        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, marginRight: 8 },
                        activeFilter === filter ? { backgroundColor: '#1d4ed8' } : { backgroundColor: '#F1F5F9', borderColor: '#e5e7eb', borderWidth: 1 }
                      ]}
                    >
                      <Text style={[
                        { fontWeight: '600', fontSize: 14 },
                        activeFilter === filter ? { color: 'white' } : { color: '#374151' }
                      ]}>{filter}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View className="gap-3">
                  {filteredProducts.map((product: any) => (
                    <TouchableOpacity 
                      key={product.id}
                      onPress={() => {
                        if (canEdit) {
                          router.push(`/edit-product?id=${product.id}`);
                        } else {
                          setActivePopup({ 
                            title: product.name, 
                            content: `Category: ${product.category}\nPrice: ${product.price}\n\n${product.description || 'No additional details provided.'}` 
                          });
                        }
                      }} 
                      className="flex-row items-center bg-[#F1F5F9] border border-gray-100/80 rounded-3xl p-4 gap-4"
                    >
                      <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-gray-200 shadow-sm"><Text className="text-2xl">{product.image_url}</Text></View>
                      <Text className="text-base font-bold text-black flex-1">{product.name}</Text>
                      {canEdit && <Pencil size={16} color="#1d4ed8" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={!!activePopup} transparent animationType="slide" onRequestClose={() => setActivePopup(null)}>
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl pb-10" style={{ paddingBottom: Math.max(insets.bottom, 24), shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 }}>
            <View className="flex-row items-center justify-between p-6 border-b border-gray-100">
              <Text className="text-xl font-bold text-black">{activePopup?.title}</Text>
              <TouchableOpacity onPress={() => setActivePopup(null)} className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
                <X size={18} color="#374151" />
              </TouchableOpacity>
            </View>
            <View className="p-6">
              <View className="bg-[#F1F5F9] p-4 rounded-3xl border border-gray-100/80">
                <Text className="text-base text-gray-700 leading-6">{activePopup?.content}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}