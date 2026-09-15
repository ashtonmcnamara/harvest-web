import React, { useState, useCallback, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Linking, ActivityIndicator, Share as NativeShare, Animated, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, SlidersHorizontal, Settings, MapPin, BadgeCheck, Bookmark, Calendar, ExternalLink, Heart, MessageCircle, Share, Pin, X, MoreHorizontal } from 'lucide-react-native';
import FarmFilterModal from '@/components/home/FarmFilterModal';
import EventFilterModal from '@/components/home/EventFilterModal';
import SettingsModal from '@/components/home/SettingsModal';
import { supabase } from '@/lib/supabase'; 
import { useAuth } from '@/components/context/AuthContext';

const USER_LOCATION = { lat: 44.835, lng: -63.674 }; 

function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(dist: number) {
  if (dist === 999) return "";
  if (dist < 1) return "Nearby";
  return `${Math.round(dist)} km away`;
}

const UpdateCard = ({ update, toggleSave, setFeedUpdates, currentUserId, userMode, router }: any) => {
  const [isLiked, setIsLiked] = useState(update.hasLiked);
  const [likesCount, setLikesCount] = useState(update.likes || 0);
  const [isPinned, setIsPinned] = useState(update.isPinned || false);

  const handleLike = async () => {
    if (!currentUserId) return;
    const previousState = isLiked;
    setIsLiked(!previousState);
    setLikesCount((prev: number) => previousState ? prev - 1 : prev + 1);
    try {
      if (previousState) {
        await supabase.from('update_likes').delete().eq('update_id', update.id).eq('user_id', currentUserId);
      } else {
        await supabase.from('update_likes').insert({ update_id: update.id, user_id: currentUserId });
      }
    } catch (error) {
      setIsLiked(previousState); 
      setLikesCount((prev: number) => previousState ? prev + 1 : prev - 1);
    }
  };

  const handlePin = async () => {
    const previousState = isPinned;
    setIsPinned(!previousState);
    setFeedUpdates((prev: any[]) => {
      const updatedList = prev.map(item => item.id === update.id ? { ...item, isPinned: !previousState } : item);
      return updatedList.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.rawTime).getTime() - new Date(a.rawTime).getTime();
      });
    });
    try { await supabase.from('updates').update({ is_pinned: !previousState }).eq('id', update.id); } catch (e) { setIsPinned(previousState); }
  };

  const handleShare = async () => {
    try { await NativeShare.share({ message: `Check out this update from ${update.author} on HarvestNS! https://harvestns.com`, url: `https://harvestns.com` }); } catch (e) {}
  };

  const handleReport = () => {
    Alert.alert(
      "Content Options",
      "Please select an action for this update.",
      [
        { 
          text: "Report Update", 
          style: "destructive", 
          onPress: async () => {
            if (currentUserId) {
              await supabase.from('reports').insert({ reporter_id: currentUserId, reported_id: update.id, item_type: 'update', reason: 'Flagged by user' });
            }
            Alert.alert("Reported", "This update has been flagged for review by HarvestNS admins.");
          } 
        },
        { 
          text: "Block User", 
          style: "destructive", 
          onPress: async () => {
            if (currentUserId && update.author_id) {
              await supabase.from('blocked_users').insert({ blocker_id: currentUserId, blocked_id: update.author_id });
              setFeedUpdates((prev: any[]) => prev.filter(u => u.author_id !== update.author_id));
            }
            Alert.alert("Blocked", "You will no longer see updates from this user.");
          } 
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  return (
    <View className="border-b border-gray-100 p-4 flex-row items-start bg-white">
      <View className="w-12 h-12 rounded-full bg-[#F1F5F9] overflow-hidden mr-3 border border-gray-200/80 shadow-sm items-center justify-center">
        {update.isAdmin ? (
          <Image source={require('@/assets/images/logo-icon.png')} className="w-14 h-14" resizeMode="contain" />
        ) : update.avatar ? (
          <Image source={{ uri: update.avatar }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <Text className="text-xl">🚜</Text>
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1 pr-4 flex-1">
            <Text className="text-base font-bold text-gray-900" numberOfLines={1}>{update.author}</Text>
            {update.isAdmin && <BadgeCheck size={16} color="#1d4ed8" />}
          </View>
          <View className="flex-row items-center gap-3">
            {userMode === 'admin' && (
              <TouchableOpacity onPress={handlePin}>
                <Pin size={20} color={isPinned ? '#1d4ed8' : '#888'} fill={isPinned ? '#1d4ed8' : 'none'} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => toggleSave('saved_updates', 'update_id', update.id, update.saved, setFeedUpdates)}>
              <Bookmark size={20} color={update.saved ? '#1d4ed8' : '#888'} fill={update.saved ? '#1d4ed8' : 'none'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReport}>
              <MoreHorizontal size={20} color="#888" />
            </TouchableOpacity>
          </View>
        </View>
        <Text className="text-sm text-gray-500 mb-2">{update.time}</Text>
        <Text className="text-base text-gray-800 leading-6 mb-4">{update.content}</Text>
        {update.image_url && (
          <View className="w-full h-40 rounded-2xl overflow-hidden mb-4 border border-gray-200/80 shadow-sm">
            <Image source={{ uri: update.image_url }} className="w-full h-full" resizeMode="cover" />
          </View>
        )}
        <View className="flex-row items-center gap-6">
          <TouchableOpacity onPress={handleLike} className="flex-row items-center gap-1.5">
            <Heart size={18} color={isLiked ? "#ef4444" : "#888"} fill={isLiked ? "#ef4444" : "none"} />
            <Text className={`text-sm font-medium ${isLiked ? 'text-red-500' : 'text-gray-500'}`}>{likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/comments/${update.id}`)} className="flex-row items-center gap-1.5">
            <MessageCircle size={18} color="#888" />
            <Text className="text-sm font-medium text-gray-500">{update.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} className="flex-row items-center gap-1.5">
            <Share size={18} color="#888" />
            <Text className="text-sm font-medium text-gray-500">{update.shares || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function HomeFeed() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState('Explore');
  const [subTab, setSubTab] = useState('All');
  
  const [showFarmFilters, setShowFarmFilters] = useState(false);  
  const [showEventFilters, setShowEventFilters] = useState(false);  
  const [showSettings, setShowSettings] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [searchQuery, setSearchQuery] = useState('');
  const [farmFilters, setFarmFilters] = useState<any>({ products: [], business: [], counties: [], hasPickup: false, hasDelivery: false, marketsOnly: false });
  const [eventFilters, setEventFilters] = useState<any>({ types: [], counties: [] });

  const [feedFarms, setFeedFarms] = useState<any[]>([]);
  const [feedEvents, setFeedEvents] = useState<any[]>([]);
  const [feedUpdates, setFeedUpdates] = useState<any[]>([]);
  const [feedArticles, setFeedArticles] = useState<any[]>([]);
  
  const { userMode } = useAuth();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(1)).current;
  const [segmentedWidth, setSegmentedWidth] = useState(0);

  const switchMainTab = (tab: string) => {
    setMainTab(tab);
    Animated.spring(slideAnim, {
      toValue: tab === 'Updates' ? 0 : 1,
      useNativeDriver: true,
      bounciness: 4,
      speed: 14
    }).start();
  };

  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      setIsLoading(true);

      async function fetchLiveFeed() {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session?.user?.id;
          if (userId) setCurrentUserId(userId);

          let savedFarms = new Set();
          let savedEvents = new Set();
          let savedUpdates = new Set();
          let likedUpdates = new Set();
          let blockedUsers = new Set();

          if (userId) {
            const [sf, se, su, lu, bu] = await Promise.all([
              supabase.from('saved_farms').select('farm_id').eq('user_id', userId),
              supabase.from('saved_events').select('event_id').eq('user_id', userId),
              supabase.from('saved_updates').select('update_id').eq('user_id', userId),
              supabase.from('update_likes').select('update_id').eq('user_id', userId),
              supabase.from('blocked_users').select('blocked_id').eq('blocker_id', userId)
            ]);
            if (sf.data) savedFarms = new Set(sf.data.map((f: any) => f.farm_id));
            if (se.data) savedEvents = new Set(se.data.map((e: any) => e.event_id));
            if (su.data) savedUpdates = new Set(su.data.map((u: any) => u.update_id));
            if (lu.data) likedUpdates = new Set(lu.data.map((l: any) => l.update_id));
            if (bu.data) blockedUsers = new Set(bu.data.map((b: any) => b.blocked_id));
          }
          
          const { data: farms } = await supabase.from('farms').select('*, products(category)');
          if (farms) {
            setFeedFarms(farms.map(f => {
              const tags = Array.from(new Set((f.products || []).map((p: any) => p.category).filter(Boolean)));
              const dist = getDistanceInKm(USER_LOCATION.lat, USER_LOCATION.lng, f.latitude, f.longitude);
              return {
                id: f.id, name: f.name, coverImage: f.cover_image_url, logo: f.avatar_url, location: f.location_address || 'Nova Scotia', latitude: f.latitude, longitude: f.longitude, distanceVal: dist, distanceLabel: formatDistance(dist), isVerified: true, tags: tags as string[], saved: savedFarms.has(f.id), county: f.county, businessType: f.business_type, hasPickup: f.has_pickup, hasDelivery: f.has_delivery, marketsOnly: f.markets_only
              };
            }));
          }

          const { data: updates } = await supabase.from('updates').select('*, profiles:author_id(first_name, last_name, avatar_url, role), update_comments(id)');
          const { data: userFarms } = await supabase.from('farm_members').select('user_id, farms(name, avatar_url)');

          if (updates) {
            const formattedUpdates = updates
              .filter(u => !blockedUsers.has(u.author_id)) // Excludes blocked authors!
              .map(u => {
                const profile = Array.isArray(u.profiles) ? u.profiles[0] : u.profiles;
                const isAdmin = profile?.role === 'admin';
                
                let authorName = 'Producer';
                let avatarUrl = null;

                if (isAdmin) {
                  authorName = 'HarvestNS';
                } else {
                  const fm = userFarms?.find(f => f.user_id === u.author_id);
                  if (fm && fm.farms) {
                    authorName = fm.farms.name;
                    avatarUrl = fm.farms.avatar_url;
                  } else {
                    authorName = `${profile?.first_name || 'Farm'} ${profile?.last_name || ''}`.trim();
                    avatarUrl = profile?.avatar_url;
                  }
                }

                return {
                  id: u.id, content: u.content, image_url: u.image_url, author: authorName, avatar: avatarUrl, author_id: u.author_id, isAdmin: isAdmin, isPinned: u.is_pinned || false, rawTime: u.created_at, time: new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), likes: u.likes_count || 0, comments: u.update_comments ? u.update_comments.length : 0, shares: 0, saved: savedUpdates.has(u.id), hasLiked: likedUpdates.has(u.id) 
                };
            });
            const sorted = formattedUpdates.sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return new Date(b.rawTime).getTime() - new Date(a.rawTime).getTime();
            });
            setFeedUpdates(sorted);
          }

          const { data: events } = await supabase.from('events').select('*');
          if (events) {
            setFeedEvents(events.map(e => {
              let safeDate = 'Upcoming';
              try { if (e.start_time) safeDate = new Date(e.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch (err) {}
              const dist = getDistanceInKm(USER_LOCATION.lat, USER_LOCATION.lng, e.latitude, e.longitude);
              return { id: e.id, title: e.title, location: e.location || 'Nova Scotia', latitude: e.latitude, longitude: e.longitude, distanceVal: dist, distanceLabel: formatDistance(dist), date: safeDate, pinned: e.is_pinned, saved: savedEvents.has(e.id), eventType: e.event_type, county: e.county };
            }));
          }

          const { data: articles } = await supabase.from('articles').select('*');
          if (articles) {
            setFeedArticles(articles.map(a => ({ id: a.id, title: a.title, url: a.url })));
          }

        } catch (e) {
          console.error("Fetch Feed Error:", e);
        } finally {
          setIsLoading(false);
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        }
      }

      fetchLiveFeed();
    }, [fadeAnim])
  );
 
  const toggleSave = async (tableName: string, idColumn: string, itemId: string, isCurrentlySaved: boolean, setLocalState: any) => {
    setLocalState((currentFeed: any[]) => currentFeed.map(item => item.id === itemId ? { ...item, saved: !isCurrentlySaved } : item));
    try {
      if (!currentUserId) return;
      if (isCurrentlySaved) {
        await supabase.from(tableName).delete().eq(idColumn, itemId).eq('user_id', currentUserId);
      } else {
        await supabase.from(tableName).insert({ [idColumn]: itemId, user_id: currentUserId });
      }
    } catch (error) {}
  };

  const displayedFarms = feedFarms.filter(farm => {
    if (searchQuery && !farm.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (farmFilters.products.length > 0 && !farm.tags.some((t: string) => farmFilters.products.includes(t))) return false;
    if (farmFilters.business.length > 0 && !farmFilters.business.includes(farm.businessType)) return false;
    if (farmFilters.counties.length > 0 && !farmFilters.counties.includes(farm.county)) return false;
    if (farmFilters.hasPickup && !farm.hasPickup) return false;
    if (farmFilters.hasDelivery && !farm.hasDelivery) return false;
    if (farmFilters.marketsOnly && !farm.marketsOnly) return false;
    return true;
  });

  const displayedEvents = feedEvents.filter(event => {
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (eventFilters.types.length > 0 && !eventFilters.types.includes(event.eventType)) return false;
    if (eventFilters.counties.length > 0 && !eventFilters.counties.includes(event.county)) return false;
    return true;
  });

  let mixedFeed: any[] = [];
  if (subTab === 'All') {
    const combined = [
      ...displayedFarms.map(f => ({ ...f, feedType: 'farm' })),
      ...displayedEvents.map(e => ({ ...e, feedType: 'event' }))
    ];
    mixedFeed = combined.sort((a, b) => a.distanceVal - b.distanceVal);
  }

  const handleTabPress = (tab: string) => {
    if (subTab === tab) {
      if (tab === 'Farms') setShowFarmFilters(true);
      if (tab === 'Events') setShowEventFilters(true);
    } else {
      setSubTab(tab);
    }
  };

  const removeFarmFilter = (type: string, value: string) => {
    setFarmFilters((prev: any) => {
      const updated = { ...prev };
      if (typeof prev[type] === 'boolean') updated[type] = false;
      else updated[type] = prev[type].filter((item: string) => item !== value);
      return updated;
    });
  };

  const removeEventFilter = (type: string, value: string) => {
    setEventFilters((prev: any) => {
      const updated = { ...prev };
      updated[type] = prev[type].filter((item: string) => item !== value);
      return updated;
    });
  };

  const renderActiveFilters = () => {
    let activeTags: { label: string, type: string, value: string }[] = [];
    if (subTab === 'Farms') {
      farmFilters.products.forEach((p: string) => activeTags.push({ label: p, type: 'products', value: p }));
      farmFilters.business.forEach((b: string) => activeTags.push({ label: b, type: 'business', value: b }));
      farmFilters.counties.forEach((c: string) => activeTags.push({ label: c, type: 'counties', value: c }));
      if (farmFilters.hasPickup) activeTags.push({ label: 'Pickup', type: 'hasPickup', value: 'true' });
      if (farmFilters.hasDelivery) activeTags.push({ label: 'Delivery', type: 'hasDelivery', value: 'true' });
      if (farmFilters.marketsOnly) activeTags.push({ label: 'Markets Only', type: 'marketsOnly', value: 'true' });
    } else if (subTab === 'Events') {
      eventFilters.types.forEach((t: string) => activeTags.push({ label: t, type: 'types', value: t }));
      eventFilters.counties.forEach((c: string) => activeTags.push({ label: c, type: 'counties', value: c }));
    }
    if (activeTags.length === 0 || subTab === 'All') return null;
    return (
      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
          {activeTags.map((tag, idx) => (
            <TouchableOpacity key={idx} onPress={() => subTab === 'Farms' ? removeFarmFilter(tag.type, tag.value) : removeEventFilter(tag.type, tag.value)} className="flex-row items-center bg-blue-50 border border-blue-200/80 px-3 py-1.5 rounded-full mr-2 shadow-xs">
              <Text className="text-[#1d4ed8] text-xs font-bold mr-1">{tag.label}</Text>
              <X size={12} color="#1d4ed8" />
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => subTab === 'Farms' ? setFarmFilters({ products: [], business: [], counties: [], hasPickup: false, hasDelivery: false, marketsOnly: false }) : setEventFilters({ types: [], counties: [] })} className="justify-center px-2 mr-6">
            <Text className="text-gray-400 text-xs font-semibold underline">Clear All</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderFarmCard = (farm: any) => (
    <TouchableOpacity key={`farm-${farm.id}`} activeOpacity={0.92} onPress={() => router.push(`/farm/${farm.id}`)}>
      <View className="rounded-3xl overflow-hidden bg-white mb-5 border border-gray-100/80 shadow-md shadow-gray-200/40">
        <View className="h-36 relative bg-[#F1F5F9] w-full">
          {farm.coverImage ? <Image source={{ uri: farm.coverImage }} className="w-full h-full" resizeMode="cover" /> : <View className="w-full h-full bg-blue-50 items-center justify-center"><Text>🚜</Text></View>}
          <View className="absolute bottom-2.5 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full flex-row items-center gap-1 border border-white/40 shadow-sm">
            <MapPin size={11} color="#1d4ed8" />
            <Text className="text-[11px] font-bold text-gray-800">{farm.distanceLabel || 'Nova Scotia'}</Text>
          </View>
        </View>
        <View className="p-3.5 pt-0">
          <View className="-mt-7 w-14 h-14 bg-white rounded-full overflow-hidden border-4 border-white shadow-md mb-2">
             {farm.logo ? <Image source={{ uri: farm.logo }} className="w-full h-full bg-[#F1F5F9]" resizeMode="cover" /> : <View className="w-full h-full bg-gray-50 items-center justify-center"><Text>🚜</Text></View>}
          </View>
          <View className="flex-row items-center gap-1.5 mb-0.5">
            <Text className="text-lg font-bold text-gray-900">{farm.name}</Text>
            {farm.isVerified && <BadgeCheck size={16} color="#1d4ed8" />}
          </View>
          <Text className="text-gray-500 mb-3 text-sm font-medium">{farm.location}</Text>
          <View className="flex-row justify-between items-end">
            <View className="flex-row flex-wrap gap-1.5 flex-1 pr-3">
              {farm.tags?.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="bg-blue-50/60 border border-blue-100/50 rounded-lg px-2 py-0.5">
                  <Text className="text-[11px] font-semibold text-[#1d4ed8]">{tag}</Text>
                </Badge>
              ))}
            </View>
            <TouchableOpacity onPress={() => toggleSave('saved_farms', 'farm_id', farm.id, farm.saved, setFeedFarms)} className="w-9 h-9 border border-gray-100 rounded-full items-center justify-center bg-white shadow-sm">
              <Bookmark size={18} color={farm.saved ? '#1d4ed8' : '#888'} fill={farm.saved ? '#1d4ed8' : 'none'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEventCard = (event: any) => (
    <TouchableOpacity key={`event-${event.id}`} activeOpacity={0.92} onPress={() => router.push(`/event/${event.id}`)} className="bg-white border border-gray-100 rounded-3xl p-3.5 mb-4 flex-row items-start relative shadow-md shadow-gray-200/30">
      <View className="w-12 h-12 bg-[#eff6ff] rounded-2xl items-center justify-center mr-3 border border-blue-100/50 shadow-xs">
        <Calendar size={22} color="#1d4ed8" />
      </View>
      <View className="flex-1 pr-10">
        <Text className="text-base font-bold text-gray-900 leading-tight">{event.title}</Text>
        <Text className="text-xs font-medium text-gray-500 mt-1">{event.location}</Text>
        <Text className="text-xs font-bold text-[#1d4ed8] mt-1">{event.date} {event.distanceLabel ? `• ${event.distanceLabel}` : ''}</Text>
      </View>
      <TouchableOpacity onPress={() => toggleSave('saved_events', 'event_id', event.id, event.saved, setFeedEvents)} className="absolute bottom-3 right-3 w-9 h-9 bg-white border border-gray-100 rounded-full items-center justify-center shadow-sm">
        <Bookmark size={16} color={event.saved ? '#1d4ed8' : '#888'} fill={event.saved ? '#1d4ed8' : 'none'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }} className="flex-1 bg-white">
      <View className="p-4" style={{ paddingTop: Math.max(insets.top, 16) + 8 }}>
        <View className="flex-row items-center justify-between mb-6 gap-3">
          <View 
            onLayout={(e) => setSegmentedWidth(e.nativeEvent.layout.width)}
            className="flex-row bg-gray-100/90 p-1 rounded-full flex-1 border border-gray-200/50 relative"
          >
            {segmentedWidth > 0 && (
              <Animated.View 
                style={{ position: 'absolute', top: 4, bottom: 4, left: 4, width: (segmentedWidth - 8) / 2, backgroundColor: '#1d4ed8', borderRadius: 9999, transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, (segmentedWidth - 8) / 2] }) }], shadowColor: '#1d4ed8', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}
              />
            )}
            {['Updates', 'Explore'].map(tab => (
              <TouchableOpacity key={tab} onPress={() => switchMainTab(tab)} style={{ flex: 1, paddingVertical: 8, alignItems: 'center', zIndex: 10 }}>
                <Text style={[{ fontWeight: '700' }, mainTab === tab ? { color: 'white' } : { color: '#6b7280' }]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => setShowSettings(true)} className="w-11 h-11 bg-gray-100/90 border border-gray-200/50 rounded-full items-center justify-center shadow-xs">
            <Settings size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-4 pb-10">
          
          {isLoading ? (
            <View className="h-64" />
          ) : (
            <Animated.View style={{ opacity: fadeAnim }}>
              {mainTab === 'Updates' && (
                <View className="-mx-4 border-t border-gray-100 bg-white">
                  {feedUpdates.map(update => (
                    <UpdateCard key={update.id} update={update} toggleSave={toggleSave} setFeedUpdates={setFeedUpdates} currentUserId={currentUserId} userMode={userMode} router={router} />
                  ))}
                </View>
              )}

              {mainTab === 'Explore' && (
                <View>
                  <View className="mb-6"> 
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                      {feedArticles.map(article => (
                        <TouchableOpacity key={article.id} activeOpacity={0.92} onPress={() => Linking.openURL(article.url)}>
                          <View className="w-60 h-36 p-3.5 mr-4 bg-[#eff6ff]/60 rounded-3xl border border-blue-100/80 shadow-sm flex-col justify-start">
                            <View className="flex-row items-center gap-1.5 mb-1.5">
                              <ExternalLink size={12} color="#1d4ed8" />
                              <Text className="text-[#1d4ed8] font-bold text-[10px] uppercase tracking-widest">Article</Text>
                            </View>
                            <Text className="font-bold text-base leading-snug text-gray-900" numberOfLines={4}>{article.title}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}

                      {feedEvents.filter(e => e.pinned).map(event => (
                        <TouchableOpacity key={`pinned-${event.id}`} activeOpacity={0.92} onPress={() => router.push(`/event/${event.id}`)}>
                          <View className="w-60 h-36 p-3.5 mr-4 bg-[#eff6ff]/60 rounded-3xl border border-blue-100/80 shadow-sm flex-col justify-start">
                            <View className="flex-row items-center gap-1.5 mb-1.5">
                              <Calendar size={12} color="#1d4ed8" />
                              <Text className="text-[#1d4ed8] font-bold text-[10px] uppercase tracking-widest">Featured Event</Text>
                            </View>
                            <View>
                              <Text className="font-bold text-base leading-snug text-gray-900 mb-1" numberOfLines={3}>{event.title}</Text>
                              <Text className="text-gray-500 text-xs font-medium" numberOfLines={1}>{event.date}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View className="flex-row gap-2 mb-4">
                    {['All', 'Events', 'Farms'].map(tab => {
                      const isActive = subTab === tab;
                      return (
                        <TouchableOpacity key={tab} onPress={() => handleTabPress(tab)} style={[isActive ? { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8', shadowColor: '#1d4ed8', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 } : { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]} className="flex-row items-center px-5 py-2.5 rounded-full border">
                          <Text className={`font-bold ${isActive ? 'text-white' : 'text-gray-700'}`}>{tab}</Text>
                          {isActive && tab !== 'All' && (
                            <View className="ml-2 pl-2 border-l border-white/30">
                              <SlidersHorizontal size={14} color="white" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View className="relative h-12 mb-4">
                    <View className="absolute left-4 z-10 top-0 bottom-0 justify-center"><Search size={20} color="#888" /></View>
                    <Input placeholder="Search..." value={searchQuery} onChangeText={setSearchQuery} className="pl-12 pr-4 rounded-full border border-gray-200/80 bg-[#F8FAFC] h-full text-black" />
                  </View>

                  {renderActiveFilters()}

                  {subTab === 'All' && (
                    <View>
                      {mixedFeed.map(item => item.feedType === 'farm' ? renderFarmCard(item) : renderEventCard(item))}
                    </View>
                  )}

                  {subTab === 'Events' && (
                    <View>
                      {displayedEvents.length === 0 && <Text className="text-gray-500 text-center mt-8 font-medium">No events match your search.</Text>}
                      {displayedEvents.map(renderEventCard)}
                    </View>
                  )}

                  {subTab === 'Farms' && (
                    <View>
                      {displayedFarms.length === 0 && <Text className="text-gray-500 text-center mt-8 font-medium">No farms match your selected filters.</Text>}
                      {displayedFarms.map(renderFarmCard)}
                    </View>
                  )}
                </View>
              )}
            </Animated.View>
          )}
        </View>
      </ScrollView>

      <FarmFilterModal visible={showFarmFilters} onClose={() => setShowFarmFilters(false)} onApply={(f: any) => { setFarmFilters(f); setShowFarmFilters(false); }} currentFilters={farmFilters} />
      <EventFilterModal visible={showEventFilters} onClose={() => setShowEventFilters(false)} onApply={(f: any) => { setEventFilters(f); setShowEventFilters(false); }} currentFilters={eventFilters} />
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
    </View>
  );
}