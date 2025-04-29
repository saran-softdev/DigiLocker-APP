// src/screens/DocumentView.js
import React from 'react';
import {SafeAreaView, ActivityIndicator} from 'react-native';

export default function DocumentView({route}) {
  const {url} = route.params;

  return <SafeAreaView className=" flex-1 mt-10"></SafeAreaView>;
}
