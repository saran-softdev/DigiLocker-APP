// src/screen/(tabs)/Saved.jsx  ← make sure the path & case match your import
import React from 'react';
import {SafeAreaView, View, Text, StyleSheet} from 'react-native';

export default function Saved() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>Saved documents</Text>
        {/* TODO: FlatList of saved docs goes here */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
  },
});
