// src/screen/(tabs)/Saved.jsx  ← make sure the path & case match your import
import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import NetworkManager from '../../lib/networkManager';

export default function Saved() {
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  
  const [savedDocs, setSavedDocs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Load saved documents
  const loadSavedDocuments = async () => {
    try {
      setRefreshing(true);
      const json = await AsyncStorage.getItem('savedFiles');
      setSavedDocs(json ? JSON.parse(json) : []);
    } catch (error) {
      console.error('Failed to load saved documents:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Check network status
  useEffect(() => {
    const checkConnectivity = async () => {
      const connected = await NetworkManager.checkConnectivity();
      setIsConnected(connected);
    };
    
    checkConnectivity();
    
    // Subscribe to network state changes
    const unsubscribe = NetworkManager.initNetworkMonitoring();
    
    // Listen for changes to AsyncStorage connectivity status
    const intervalId = setInterval(async () => {
      const connected = await NetworkManager.getConnectivityStatus();
      setIsConnected(connected);
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  // Load saved documents on mount
  useEffect(() => {
    loadSavedDocuments();
  }, []);

  // Verify file existence
  const verifyFiles = async () => {
    try {
      setRefreshing(true);
      
      const json = await AsyncStorage.getItem('savedFiles');
      const files = json ? JSON.parse(json) : [];
      
      // Validate all files
      const validFiles = [];
      for (const file of files) {
        const exists = await RNFS.exists(file.path);
        if (exists) {
          validFiles.push(file);
        }
      }
      
      // Update saved files list if any files were removed
      if (validFiles.length !== files.length) {
        await AsyncStorage.setItem('savedFiles', JSON.stringify(validFiles));
        Alert.alert('Files Updated', 'Some invalid files were removed from your saved list.');
      }
      
      setSavedDocs(validFiles);
    } catch (error) {
      console.error('Failed to verify files:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Open document
  const handleOpenDocument = (file) => {
    navigation.navigate('DocumentView', {
      url: `file://${file.path}`,
      docName: file.name,
    });
  };

  // Delete document
  const handleDeleteDocument = async (file) => {
    try {
      // First delete the physical file
      if (await RNFS.exists(file.path)) {
        await RNFS.unlink(file.path);
      }
      
      // Update the saved files list
      const updatedDocs = savedDocs.filter(doc => doc.id !== file.id);
      await AsyncStorage.setItem('savedFiles', JSON.stringify(updatedDocs));
      setSavedDocs(updatedDocs);
      
      Alert.alert('Success', `"${file.name}" has been deleted.`);
    } catch (error) {
      Alert.alert('Error', `Failed to delete file: ${error.message}`);
    }
  };

  const renderItem = ({item}) => {
    // Calculate size in KB
    const sizeKB = (item.fileSize / 1024).toFixed(2);
    
    // Format saved date
    const savedDate = item.savedAt 
      ? new Date(item.savedAt).toLocaleDateString() 
      : 'Unknown date';
    
    // File type display
    const fileType = item.fileType 
      ? item.fileType.replace('application/', '').toUpperCase()
      : 'PDF';

    return (
      <View 
        className={`p-4 mb-3 rounded-xl ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-md`}
      >
        <View className="flex-row items-center mb-2">
          <MaterialIcons
            name="insert-drive-file"
            size={24}
            color={isDark ? '#a5b4fc' : '#4f46e5'}
          />
          <Text 
            className={`text-lg font-bold ml-2 ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}
          >
            {item.name}
          </Text>
        </View>
        
        <View className="flex-row items-center mb-3">
          <View className="flex-row items-center mr-4">
            <MaterialIcons
              name="description"
              size={14}
              color={isDark ? '#9ca3af' : '#6b7280'}
            />
            <Text 
              className={`ml-1 text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {fileType} · {sizeKB} KB
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Ionicons
              name="time-outline"
              size={14}
              color={isDark ? '#9ca3af' : '#6b7280'}
            />
            <Text 
              className={`ml-1 text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              Saved: {savedDate}
            </Text>
          </View>
        </View>
        
        <View className="flex-row justify-end mt-2 space-x-2">
          <TouchableOpacity
            className="p-2 bg-indigo-100 rounded-full"
            onPress={() => handleOpenDocument(item)}
          >
            <MaterialIcons name="visibility" size={20} color="#4f46e5" />
          </TouchableOpacity>
          
          <TouchableOpacity
            className="p-2 bg-red-100 rounded-full"
            onPress={() => 
              Alert.alert(
                'Delete Document',
                `Are you sure you want to delete "${item.name}"?`,
                [
                  {text: 'Cancel', style: 'cancel'},
                  {
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => handleDeleteDocument(item)
                  }
                ]
              )
            }
          >
            <MaterialIcons name="delete" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 relative">
      <View
        className={`absolute inset-0 bg-gradient-to-br ${
          isDark
            ? 'from-gray-900 via-gray-800 to-gray-700'
            : 'from-indigo-400 via-purple-500 to-pink-400'
        }`}
      />
      
      <SafeAreaView className="flex-1 px-4 py-6 pt-20">
        {/* HEADER */}
        <View 
          className={`mb-6 p-4 rounded-2xl ${
            isDark 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-white/90 border-gray-200'
          } border flex-row items-center justify-between shadow`}
        >
          <Text
            className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            Saved Documents
          </Text>
          
          <TouchableOpacity
            className="bg-indigo-600 px-3 py-2 rounded-xl"
            onPress={verifyFiles}
          >
            <Text className="text-white font-medium">Verify</Text>
          </TouchableOpacity>
        </View>
        
        {/* OFFLINE INDICATOR */}
        {!isConnected && (
          <View className="mb-4 p-3 rounded-xl bg-yellow-500/90 border-yellow-600 border">
            <Text className="text-white text-center font-medium">
              You're currently offline
            </Text>
          </View>
        )}
        
        {/* LIST OR EMPTY STATE */}
        {savedDocs.length === 0 ? (
          <View className="flex-1 justify-center items-center px-4">
            <Ionicons 
              name="bookmark-outline" 
              size={64} 
              color={isDark ? '#9ca3af' : '#6b7280'} 
            />
            <Text 
              className={`text-lg font-semibold mt-4 ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}
            >
              No Saved Documents
            </Text>
            <Text 
              className={`text-center mt-2 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Save documents for offline viewing from the Home screen
            </Text>
            
            <TouchableOpacity
              className="mt-6 bg-indigo-600 px-6 py-3 rounded-xl"
              onPress={() => navigation.navigate('Home')}
            >
              <Text className="text-white font-medium">Go to Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={savedDocs}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{paddingBottom: 60}}
            refreshing={refreshing}
            onRefresh={loadSavedDocuments}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Add your styles here
});
