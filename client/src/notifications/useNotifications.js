import {useEffect, useRef} from 'react';
import {PermissionsAndroid, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../lib/apiClient';
import {initializeApp} from '@react-native-firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
} from '@react-native-firebase/messaging';

const firebaseApp = initializeApp();

const requestUserPermission = async () => {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );

  if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    console.log('✅ Notification permission granted');
  } else {
    console.log('❌ Notification permission denied');
  }
};

export const useNotification = () => {
  const messageQueue = useRef([]); // Holds incoming messages
  const isAlerting = useRef(false); // Controls queue flow

  const showNextAlert = () => {
    if (messageQueue.current.length === 0) {
      isAlerting.current = false;
      return;
    }

    const msg = messageQueue.current.shift(); // Get the next message
    isAlerting.current = true;

    Alert.alert(
      msg.notification?.title || 'Notification',
      msg.notification?.body || 'You have a new message.',
      [
        {
          text: 'OK',
          onPress: () => showNextAlert(),
        },
      ],
      {cancelable: false},
    );
  };

  useEffect(() => {
    let unsubscribeForeground;

    const setupFCM = async () => {
      try {
        const messaging = getMessaging(firebaseApp);
        const token = await getToken(messaging);
        console.log('📟 FCM Token:', token);

        const userJson = await AsyncStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;
        console.log('User:', user);

        if (user?.id && token) {
          await apiClient.post('/notification/update-fcm-token', {
            userId: user.id,
            token: token,
          });
          console.log('✅ FCM token sent to backend');
        }

        // Foreground notification handler
        unsubscribeForeground = onMessage(messaging, async remoteMessage => {
          console.log('📲 Notification received in foreground:', remoteMessage);

          messageQueue.current.push(remoteMessage);

          if (!isAlerting.current) {
            showNextAlert();
          }
        });
      } catch (err) {
        console.error('❌ FCM Setup Error:', err.message);
      }
    };

    requestUserPermission();
    setupFCM();

    return () => {
      if (unsubscribeForeground) unsubscribeForeground();
    };
  }, []);
};
