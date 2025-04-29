// src/screens/Upload.js
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {pick, keepLocalCopy} from '@react-native-documents/picker';
import Icon from 'react-native-vector-icons/Feather';
import apiClient from '../../lib/apiClient'; // ← centralized client
import {useNavigation} from '@react-navigation/native';

export default function Upload() {
  const navigation = useNavigation();
  const [documentName, setDocumentName] = useState('');
  const [fileUri, setFileUri] = useState(null);
  const [originalName, setOriginalName] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 1) pick & copy to local storage
  const handlePickFile = async () => {
    try {
      const [picked] = await pick();
      setOriginalName(picked.name ?? '');
      const [copyResult] = await keepLocalCopy({
        files: [{uri: picked.uri, fileName: picked.name ?? 'file'}],
        destination: 'documentDirectory',
      });
      if (copyResult.status === 'success') {
        setFileUri(copyResult.localUri);
        // default the documentName to the picked file name (without extension)
        setDocumentName(picked.name?.replace(/\.[^/.]+$/, '') ?? '');
      } else {
        console.warn('Could not copy file:', copyResult);
      }
    } catch (err) {
      console.warn('User cancelled or error:', err);
    }
  };

  // 2) date picker change
  const onChangeDate = (_, selected) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) setExpiryDate(selected);
  };

  // 3) submit handler
  const handleSubmit = async () => {
    if (!fileUri || !documentName) {
      return Alert.alert('Error', 'Please choose a file and enter a name.');
    }

    const form = new FormData();
    form.append('file', {
      uri: fileUri,
      name: originalName,
      type: 'application/octet-stream',
    });
    form.append('documentName', documentName);
    form.append('hasExpiry', hasExpiry);
    if (hasExpiry) {
      form.append('expirationDate', expiryDate.toISOString());
    }

    try {
      await apiClient.post('/documents/upload', form, {
        headers: {'Content-Type': 'multipart/form-data'},
      });
      Alert.alert('Success', 'Document uploaded securely.');
      // reset if you like:
      setFileUri(null);
      setDocumentName('');
      setHasExpiry(false);
      navigation.navigate('MainTabs', {screen: 'Home'});
    } catch (err) {
      console.error(err);
      Alert.alert('Upload Failed', err.message);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 p-6 justify-center">
      <View className="bg-white rounded-2xl p-6 shadow-md space-y-5">
        {/* Document Name */}
        <View>
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Document Name
          </Text>
          <TextInput
            className="w-full mb-4 bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-700"
            placeholder="Enter a name"
            value={documentName}
            onChangeText={setDocumentName}
          />
        </View>

        {/* File Picker */}
        <TouchableOpacity
          className="w-full flex-row items-center justify-center bg-indigo-600 rounded-lg py-3 mb-2"
          activeOpacity={0.8}
          onPress={handlePickFile}>
          <Icon name="upload" size={20} color="#fff" className="mr-2" />
          <Text className="text-white font-medium">
            {fileUri ? 'Change File' : 'Pick Document'}
          </Text>
        </TouchableOpacity>
        {fileUri && (
          <Text className="text-center text-sm text-gray-500">
            {fileUri.split('/').pop()}
          </Text>
        )}

        {/* Expiry Toggle */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-800 font-medium">Expires?</Text>
          <Switch
            value={hasExpiry}
            onValueChange={setHasExpiry}
            trackColor={{false: '#E5E7EB', true: '#4ADE80'}}
            thumbColor={hasExpiry ? '#10B981' : '#F3F4F6'}
          />
        </View>

        {/* Date Picker */}
        {hasExpiry && (
          <>
            <TouchableOpacity
              className="w-full bg-gray-100 border  mb-4 border-gray-200 rounded-lg px-4 py-3"
              onPress={() => setShowDatePicker(true)}>
              <Text className="text-gray-700">
                Expiry: {expiryDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={expiryDate}
                mode="date"
                display="default"
                onChange={onChangeDate}
              />
            )}
          </>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          className="w-full bg-emerald-500 rounded-lg py-3"
          activeOpacity={0.8}
          onPress={handleSubmit}>
          <Text className="text-white text-center font-semibold">
            Upload Document
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
