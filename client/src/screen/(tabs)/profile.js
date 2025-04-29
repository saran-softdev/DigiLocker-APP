// src/screen/(tabs)/Profile.js
import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch} from 'react-redux';
import {logout} from '../../redux/actions/authActions';
import Toast from 'react-native-toast-message';
import {useNavigation} from '@react-navigation/native';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  // Load user from AsyncStorage once on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const json = await AsyncStorage.getItem('user');
        if (json) setUser(JSON.parse(json));
      } catch (err) {
        console.warn('Failed to load user:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleSignOut = async () => {
    // clear storage + redux state
    await dispatch(logout());
    Toast.show({
      type: 'success',
      text1: 'Signed Out',
      text2: 'You have signed out successfully',
    });
    navigation.replace('SignIn');
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // fallbacks in case something went wrong
  const username = user?.username || 'User';
  const email = user?.email || 'user@example.com';
  const initial = username.charAt(0).toUpperCase();

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="items-center mt-12 mb-8">
        <View className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
          <Text className="text-3xl font-bold text-white">{initial}</Text>
        </View>
        <Text className="mt-4 text-2xl font-semibold text-gray-800">
          {username}
        </Text>
        <Text className="mt-1 text-gray-500">{email}</Text>
      </View>

      {/* Info Card */}
      <View className="bg-white mx-4 rounded-2xl shadow-md divide-y divide-gray-200 overflow-hidden">
        <View className="flex-row justify-between px-6 py-4 bg-gray-50">
          <Text className="text-gray-600">App Version</Text>
          <Text className="text-gray-800">1.0.0</Text>
        </View>
        <View className="flex-row justify-between px-6 py-4">
          <Text className="text-gray-600">Support</Text>
          <Text className="text-indigo-600 font-medium">
            raziyaumarkhan@gmail.com
          </Text>
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        onPress={handleSignOut}
        className="mt-10 mx-4 py-4 bg-red-600 rounded-2xl shadow-lg items-center">
        <Text className="text-white text-lg font-semibold">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
