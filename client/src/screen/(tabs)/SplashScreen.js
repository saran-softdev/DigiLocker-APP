import React, {useEffect} from 'react';
import {View, ActivityIndicator} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch} from 'react-redux';
import {SIGNIN_SUCCESS} from '../../redux/actionTypes';

export default function SplashScreen({navigation}) {
  const dispatch = useDispatch();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        if (user && token) {
          dispatch({
            type: SIGNIN_SUCCESS,
            payload: {user: JSON.parse(user), token},
          });
          navigation.replace('MainTabs');
        } else {
          navigation.replace('SignIn');
        }
      } catch (error) {
        console.error('Auto login error:', error);
        navigation.replace('SignIn');
      }
    };

    checkLoginStatus();
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#4f46e5" />
    </View>
  );
}
