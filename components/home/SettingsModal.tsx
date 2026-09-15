import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Modal, Switch, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { X, Calendar, LogOut, UserX, MessageSquareWarning, Pencil, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/context/AuthContext';
import { useRouter } from 'expo-router';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userMode, setMode } = useAuth();
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [firstName, setFirstName] = useState('HarvestNS');
  const [lastName, setLastName] = useState('User');
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    async function fetchName() {
      if (!visible) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data } = await supabase.from('profiles').select('first_name, last_name').eq('id', session.user.id).single();
        if (data) {
          if (data.first_name) setFirstName(data.first_name);
          if (data.last_name) setLastName(data.last_name);
        }
      }
    }
    fetchName();
  }, [visible]);

  const saveProfileName = async () => {
    setSavingName(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from('profiles').update({ first_name: firstName, last_name: lastName }).eq('id', session.user.id);
      }
      setIsEditingName(false);
    } catch (error) {
      Alert.alert("Error", "Could not save your name.");
    } finally {
      setSavingName(false);
    }
  };

  const handleLogout = async () => {
    onClose();
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log('Logout error:', error);
    } 
    setMode(null);
    router.replace('/login');
  };

  const handleContactAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      // FIXED: Hardcoded Admin ID for guaranteed routing
      const ADMIN_ID = 'bd4a8bfc-89ed-425f-9e03-d6e74c89a633';

      const { data: farmMember } = await supabase.from('farm_members').select('farm_id').eq('user_id', session.user.id).maybeSingle();
      if (!farmMember) {
        Alert.alert("Error", "You must be attached to a farm profile to message the admin.");
        return;
      }

      const { data: existingConv } = await supabase.from('conversations')
        .select('id')
        .eq('farm_id', farmMember.farm_id)
        .eq('consumer_id', ADMIN_ID)
        .maybeSingle();

      let convId = existingConv?.id;

      if (!convId) {
        const { data: newConv, error } = await supabase.from('conversations')
          .insert({ farm_id: farmMember.farm_id, consumer_id: ADMIN_ID })
          .select().single();
          
        if (error) throw error;
        convId = newConv.id;
      }

      onClose();
      setTimeout(() => {
        router.push(`/message/${convId}`); 
        setTimeout(() => {
          Alert.alert(
            "Admin Communication",
            "Please note that the HarvestNS Admin monitors app messages periodically. For formal communications, please contact us via email at maritime.collective.institute@gmail.com"
          );
        }, 400);
      }, 300);

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not initiate chat with the Admin.");
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account", 
      "Are you sure you want to permanently delete your account? This action cannot be undone.", 
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await supabase.rpc('delete_user'); 
              await supabase.auth.signOut();
              onClose();
              setMode(null);
              router.replace('/login');
            } catch (error) {
              Alert.alert("Error", "Could not delete account. Please contact support.");
            }
          }
        }
      ]
    );
  };

  const displayRole = userMode ? userMode.charAt(0).toUpperCase() + userMode.slice(1) : 'User';
  const initials = `${firstName.charAt(0)}${lastName !== 'User' ? lastName.charAt(0) : ''}`;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-[#F9FAFB]" style={{ paddingTop: insets.top }}>
        
        <View className="flex-row items-center justify-between px-6 pb-4 pt-4 border-b border-gray-100">
          <Text className="text-2xl font-bold text-black">Settings</Text>
          <TouchableOpacity onPress={onClose} className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center border border-gray-200">
            <X size={18} color="#333" />
          </TouchableOpacity>
        </View>

        <View className="px-5 mt-6">
          
          <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm shadow-gray-200/40">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-14 h-14 bg-[#eff6ff] border border-blue-100 rounded-full items-center justify-center mr-4">
                  <Text className="text-[#1d4ed8] text-xl font-bold">{initials}</Text>
                </View>
                <View className="flex-1 pr-2">
                  {isEditingName ? (
                    <View className="gap-2">
                      <TextInput 
                        className="bg-[#F9FAFB] border border-gray-200 rounded-lg px-3 py-1.5 font-bold text-black" 
                        value={firstName} 
                        onChangeText={setFirstName} 
                        placeholder="First Name" 
                      />
                      <TextInput 
                        className="bg-[#F9FAFB] border border-gray-200 rounded-lg px-3 py-1.5 font-bold text-black" 
                        value={lastName} 
                        onChangeText={setLastName} 
                        placeholder="Last Name" 
                      />
                    </View>
                  ) : (
                    <View>
                      <Text className="text-lg font-bold text-black mb-0.5">{firstName} {lastName}</Text>
                      <Text className="text-sm text-gray-500 font-medium">{displayRole} Account</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <TouchableOpacity onPress={isEditingName ? saveProfileName : () => setIsEditingName(true)} className="p-2 bg-gray-50 rounded-full border border-gray-200">
                {savingName ? <ActivityIndicator size="small" color="#1d4ed8" /> : (
                  isEditingName ? <Check size={18} color="#10b981" /> : <Pencil size={18} color="#6b7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {userMode === 'producer' && (
            <TouchableOpacity onPress={handleContactAdmin} className="flex-row items-center bg-white border border-gray-200 rounded-2xl p-4 mb-4 gap-4 shadow-sm shadow-gray-200/40">
              <View className="w-8 items-center"><MessageSquareWarning size={20} color="#1d4ed8" /></View>
              <Text className="text-base font-bold text-gray-800">Contact HarvestNS Admin</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => { onClose(); setTimeout(() => router.push('/rsvp'), 150); }} className="flex-row items-center bg-white border border-gray-200 rounded-2xl p-4 mb-4 gap-4 shadow-sm shadow-gray-200/40">
            <View className="w-8 items-center"><Calendar size={20} color="#1d4ed8" /></View>
            <Text className="text-base font-bold text-gray-800">RSVP'd Events</Text>
          </TouchableOpacity>

          <View className="flex-row items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm shadow-gray-200/40">
            <View className="flex-row items-center gap-4">
              <View className="w-8" />
              <Text className="text-base font-bold text-gray-800">Dark Mode</Text>
            </View>
            <Switch value={isDarkMode} onValueChange={setIsDarkMode} trackColor={{ false: '#E5E7EB', true: '#1d4ed8' }} thumbColor="white" />
          </View>

          <TouchableOpacity onPress={handleLogout} className="flex-row items-center bg-white border border-gray-200 rounded-2xl p-4 mb-4 gap-4 shadow-sm shadow-gray-200/40">
            <View className="w-8 items-center"><LogOut size={20} color="#4B5563" /></View>
            <Text className="text-base font-bold text-gray-800">Log Out</Text>
          </TouchableOpacity>

          {userMode !== 'admin' && (
            <TouchableOpacity onPress={handleDeleteAccount} className="flex-row items-center bg-[#fef2f2] border border-[#fecaca] rounded-2xl p-4 gap-4 mt-4 shadow-sm shadow-gray-200/40">
              <View className="w-8 items-center"><UserX size={20} color="#dc2626" /></View>
              <Text className="text-base font-bold text-[#dc2626]">Delete Account</Text>
            </TouchableOpacity>
          )}

        </View>
      </View>
    </Modal>
  );
}