// src/screens/DocumentView.js
import React, {useEffect} from 'react';
import {SafeAreaView, Text, StyleSheet, Alert, Linking} from 'react-native';
import FileViewer from 'react-native-file-viewer';

export default function DocumentView({route, navigation}) {
  const {url} = route.params || {};
  
  useEffect(() => {
    if (!url) {
      navigation.goBack();
      return;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      Linking.openURL(url)
        .catch(() => Alert.alert('Error', 'Unable to open link'))
        .finally(() => navigation.goBack());
    } else if (url.startsWith('file://')) {
      const localPath = url.replace('file://', '');
      FileViewer.open(localPath, { showOpenWithDialog: true })
        .catch(() => Alert.alert('Error', 'Unable to open file'))
        .finally(() => navigation.goBack());
    } else {
      Alert.alert('Error', 'Unsupported URL schema');
      navigation.goBack();
    }
  }, [url, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.message}>Opening document...</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  message: { fontSize: 16, color: '#333' },
});
