// src/screens/Documents.js

import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  useColorScheme,
  Alert,
  Share,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import apiClient from '../../lib/apiClient';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const tabs = [
  {key: 'all', label: 'All Documents'},
  {key: 'expiring', label: 'Expiring Soon'},
];

// axios baseURL: http://…/api
const baseURL = apiClient.defaults.baseURL;
// strip /api so we don't get /api/api/…
const rootURL = baseURL.replace(/\/api\/?$/, '');

export default function Documents() {
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [activeTab, setActiveTab] = useState('all');
  const [docs, setDocs] = useState([]);
  const [savedDocs, setSavedDocs] = useState([]);

  // fetch docs
  useEffect(() => {
    apiClient
      .get('/documents')
      .then(res => setDocs(res.data.documents))
      .catch(err => Alert.alert('Error', err.message));
  }, []);

  // load offline list
  useEffect(() => {
    (async () => {
      const json = await AsyncStorage.getItem('savedFiles');
      setSavedDocs(json ? JSON.parse(json) : []);
    })();
  }, []);

  // expiration logic
  const now = Date.now();
  const weekMillis = 1000 * 60 * 60 * 24 * 7;
  const expiring = docs.filter(
    d =>
      d.expirationDate &&
      new Date(d.expirationDate).getTime() - now <= weekMillis,
  );
  const tabsWithCount = tabs.map(t =>
    t.key === 'expiring' ? {...t, count: expiring.length} : t,
  );
  const displayList = activeTab === 'expiring' ? expiring : docs;

  // BUILD FULL URL
  const makeUrl = fileURL => `${rootURL}${fileURL}`;

  // ANDROID write-permission
  async function requestStoragePermission() {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version >= 33) return true;
    const r = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'Needed to save files locally.',
      },
    );
    return r === PermissionsAndroid.RESULTS.GRANTED;
  }

  // 1) DIRECT DOWNLOAD using RNFS + token header
  const handleDirectDownload = async (fileURL, documentName, id) => {
    try {
      // 1) get your auth token
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Missing auth token');

      // 2) build the URL and filename
      const downloadUrl = `${rootURL}${fileURL}`; // no double /api
      const encName = fileURL.split('/').pop(); // "1234-dummy.pdf.enc"
      const extMatch = encName.match(/\.([^.]+)\.enc$/); // ["dummy.pdf.enc","pdf"]
      const ext = extMatch ? extMatch[1] : 'bin'; // "pdf"
      const filename = `${documentName.replace(/\s+/g, '_')}_${id}.${ext}`;

      // 3) RNFS.downloadFile with Android’s DownloadManager
      const downloadDest = `${RNFS.DownloadDirectoryPath}/DigiVault/${filename}`;
      // ensure subfolder exists
      const dir = `${RNFS.DownloadDirectoryPath}/DigiVault`;
      if (!(await RNFS.exists(dir))) {
        await RNFS.mkdir(dir);
      }

      const {promise} = RNFS.downloadFile({
        fromUrl: downloadUrl,
        toFile: downloadDest,
        headers: {Authorization: `Bearer ${token}`},
        // **this** bit hands it off to Android's DownloadManager
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: downloadDest,
          description: 'Downloading document',
          mime: `application/${ext}`,
          mediaScannable: true,
        },
      });

      const result = await promise;
      if (result.statusCode !== 200) {
        throw new Error(`HTTP ${result.statusCode}`);
      }

      Alert.alert('Downloaded', `Saved to ${downloadDest}`);
    } catch (e) {
      Alert.alert('Download error', e.message);
    }
  };

  // 2) OFFLINE save (unchanged)
  const handleDownload = async (fileURL, documentName, id) => {
    try {
      if (!(await requestStoragePermission())) {
        return Alert.alert('Permission denied');
      }
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Missing auth token');

      const folderPath = `${RNFS.DocumentDirectoryPath}/DigiVault`;
      if (!(await RNFS.exists(folderPath))) {
        await RNFS.mkdir(folderPath);
      }

      const ext = fileURL.split('.').pop();
      const filename = `${documentName.replace(/\s/g, '_')}_${id}.${ext}`;
      const destPath = `${folderPath}/${filename}`;
      const download = RNFS.downloadFile({
        fromUrl: makeUrl(fileURL),
        toFile: destPath,
        headers: {Authorization: `Bearer ${token}`},
      });
      const result = await download.promise;
      if (result.statusCode !== 200) {
        throw new Error(`Failed: ${result.statusCode}`);
      }

      const json = await AsyncStorage.getItem('savedFiles');
      const saved = json ? JSON.parse(json) : [];
      saved.push({id, name: documentName, path: destPath});
      await AsyncStorage.setItem('savedFiles', JSON.stringify(saved));
      setSavedDocs(saved);

      Alert.alert('Downloaded', `${documentName} saved for offline.`);
    } catch (e) {
      Alert.alert('Download error', e.message);
    }
  };

  // 3) OPEN offline
  const handleOpenOffline = id => {
    const file = savedDocs.find(f => f.id === id);
    if (!file) {
      return Alert.alert('Not found', 'File not in offline storage');
    }
    navigation.navigate('DocumentView', {url: `file://${file.path}`});
  };

  // 4) REMOVE offline
  const handleRemoveOffline = async (id, documentName) => {
    try {
      const json = await AsyncStorage.getItem('savedFiles');
      let saved = json ? JSON.parse(json) : [];
      const file = saved.find(f => f.id === id);
      if (!file) throw new Error('File not found');
      await RNFS.unlink(file.path);
      saved = saved.filter(f => f.id !== id);
      await AsyncStorage.setItem('savedFiles', JSON.stringify(saved));
      setSavedDocs(saved);
      Alert.alert('Removed', `${documentName} offline copy deleted.`);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // Share & delete (unchanged)
  const handleShare = async url => {
    try {
      const shareUrl = makeUrl(url);
      await Share.share({url: shareUrl, message: shareUrl});
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };
  const handleDelete = id => {
    Alert.alert('Delete file?', 'This cannot be undone.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete('/documents/' + id);
            setDocs(cur => cur.filter(d => d._id !== id));
            const json = await AsyncStorage.getItem('savedFiles');
            let saved = json ? JSON.parse(json) : [];
            if (saved.some(f => f.id === id)) {
              saved = saved.filter(f => f.id !== id);
              await AsyncStorage.setItem('savedFiles', JSON.stringify(saved));
              setSavedDocs(saved);
            }
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  // render item
  const renderItem = ({item}) => {
    const ts = parseInt(item._id.substring(0, 8), 16) * 1000;
    const uploaded = new Date(ts).toLocaleDateString();
    const expiresSoon =
      item.expirationDate &&
      new Date(item.expirationDate).getTime() - now <= weekMillis;
    const sizeKB = (item.fileSize / 1024).toFixed(2);
    const isSavedOffline = savedDocs.some(f => f.id === item._id);

    return (
      <TouchableOpacity
        className="p-5 mb-4 rounded-2xl shadow-lg bg-white dark:bg-gray-800"
        onPress={() => {}}>
        <View className="flex-row items-center mb-4">
          <MaterialIcons
            name="insert-drive-file"
            size={28}
            className="text-indigo-600 mr-3"
          />
          <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {item.documentName}
          </Text>
        </View>

        <View className="flex-row flex-wrap mb-4">
          <View className="flex-row items-center mr-6 mb-2">
            <MaterialIcons
              name="description"
              size={16}
              className="text-gray-400 mr-1"
            />
            <Text className="text-sm text-gray-600 dark:text-gray-300">
              {item.fileType.replace('application/', '').toUpperCase()} ·{' '}
              {sizeKB} KB
            </Text>
          </View>
          <View className="flex-row items-center mb-2">
            <Ionicons
              name="time-outline"
              size={16}
              className="text-gray-400 mr-1"
            />
            <Text className="text-sm text-gray-600 dark:text-gray-300">
              Uploaded: {uploaded}
            </Text>
          </View>
        </View>

        {item.expirationDate && (
          <View className="flex-row items-center mb-6">
            <Ionicons
              name="calendar-outline"
              size={16}
              className="text-gray-400 mr-1"
            />
            <Text className="text-sm text-gray-600 dark:text-gray-300">
              Expires: {new Date(item.expirationDate).toLocaleDateString()}
            </Text>
            {expiresSoon && (
              <View className="ml-3 bg-red-100 px-2 py-0.5 rounded-full">
                <Text className="text-xs font-medium text-red-600">Soon</Text>
              </View>
            )}
          </View>
        )}

        <View className="flex-row justify-end gap-2">
          {/* DIRECT DOWNLOAD */}
          <TouchableOpacity
            className="p-2 bg-blue-50 rounded-full"
            onPress={() =>
              handleDirectDownload(item.fileURL, item.documentName, item._id)
            }>
            <MaterialIcons
              name="file-download"
              size={20}
              className="text-blue-600"
            />
          </TouchableOpacity>

          {/* OFFLINE SAVE / OPEN / REMOVE */}
          {isSavedOffline ? (
            <>
              <TouchableOpacity
                className="p-2 bg-indigo-50 rounded-full"
                onPress={() => handleOpenOffline(item._id)}>
                <MaterialIcons
                  name="folder-open"
                  size={20}
                  className="text-indigo-600"
                />
              </TouchableOpacity>
              <TouchableOpacity
                className="p-2 bg-red-50 rounded-full"
                onPress={() =>
                  handleRemoveOffline(item._id, item.documentName)
                }>
                <MaterialIcons
                  name="cloud-off"
                  size={20}
                  className="text-red-500"
                />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              className="p-2 bg-indigo-50 rounded-full"
              onPress={() =>
                handleDownload(item.fileURL, item.documentName, item._id)
              }>
              <MaterialIcons
                name="cloud-download"
                size={20}
                className="text-indigo-600"
              />
            </TouchableOpacity>
          )}

          {/* SHARE */}
          <TouchableOpacity
            className="p-2 bg-indigo-50 rounded-full"
            onPress={() => handleShare(item.fileURL)}>
            <MaterialIcons name="share" size={20} className="text-indigo-600" />
          </TouchableOpacity>

          {/* DELETE */}
          <TouchableOpacity
            className="p-2 bg-red-50 rounded-full"
            onPress={() => handleDelete(item._id)}>
            <MaterialIcons name="delete" size={20} className="text-red-500" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 relative">
      <View
        className={`absolute inset-0 bg-gradient-to-br ${
          isDark
            ? 'from-gray-900 via-gray-800 to-gray-700'
            : 'from-indigo-500 via-purple-600 to-pink-500'
        }`}
      />

      <SafeAreaView className="flex-1 px-4 py-6 pt-20">
        {/* HEADER */}
        <View
          className={`mb-6 p-4 rounded-2xl ${
            isDark
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white/90 border-gray-200'
          } border flex-row items-center justify-between shadow`}>
          <Text
            className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
            Digi Vault
          </Text>
          <TouchableOpacity
            className="bg-indigo-600 px-5 py-2 rounded-2xl shadow"
            onPress={() => navigation.navigate('Upload')}>
            <Text className="text-white font-semibold">+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* ALERT BAR */}
        <View
          className={`mb-2 p-4 rounded-2xl ${
            isDark
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white/90 border-gray-200'
          } border flex-row items-center`}>
          <Ionicons
            name="alert-circle-outline"
            size={20}
            className="text-yellow-400 mr-2"
          />
          <Text
            className={`flex-1 font-medium ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
            Attention Required
          </Text>
          <View className="bg-yellow-500/80 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-semibold">
              {expiring.length} expiring soon
            </Text>
          </View>
        </View>

        {/* TABS */}
        <View
          className={`mb-2 p-2 rounded-2xl ${
            isDark
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white/90 border-gray-200'
          } border flex-row justify-around`}>
          {tabsWithCount.map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full ${
                activeTab === tab.key ? 'bg-indigo-600/80' : ''
              }`}>
              <View className="flex-row items-center">
                <Text
                  className={`text-sm font-medium ${
                    activeTab === tab.key
                      ? 'text-white'
                      : isDark
                      ? 'text-gray-300'
                      : 'text-gray-700'
                  }`}>
                  {tab.label}
                </Text>
                {tab.count != null && (
                  <View
                    className={`ml-2 px-2 rounded-full ${
                      activeTab === tab.key ? 'bg-white/30' : 'bg-gray-200/30'
                    }`}>
                    <Text
                      className={`text-xs font-bold ${
                        activeTab === tab.key ? 'text-white' : 'text-gray-700'
                      }`}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* LIST or EMPTY */}
        {displayList.length === 0 ? (
          <Text className="text-center mt-10 text-gray-500">
            {activeTab === 'expiring'
              ? 'No expiring documents.'
              : 'No documents yet.'}
          </Text>
        ) : (
          <FlatList
            data={displayList}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={{paddingBottom: 80}}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
