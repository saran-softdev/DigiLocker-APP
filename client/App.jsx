// App.js
import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';
import Toast from 'react-native-toast-message';
import './global.css';

import store from './src/redux/store';
import SignIn from './src/screen/(tabs)/signIn';
import SignUp from './src/screen/(tabs)/signUp';
import Upload from './src/screen/(tabs)/upload';
import DocumentView from './src/screen/(tabs)/DocumentView';
import MainTabs from './src/navigation/MainTabs';
import SplashScreen from './src/screen/(tabs)/SplashScreen'; // ✅ new fil
import {useNotification} from './src/notifications/useNotifications';

const Stack = createNativeStackNavigator();

export default function App() {
  useNotification();
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        {/* Make the native status bar translucent so your SafeAreaView padding is
            what shows through and your background color continues up behind it */}
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />

        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{headerShown: false}}
            initialRouteName="Splash">
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="SignIn" component={SignIn} />
            <Stack.Screen name="SignUp" component={SignUp} />
            <Stack.Screen name="Upload" component={Upload} />
            <Stack.Screen name="DocumentView" component={DocumentView} />
            {/* After auth, this becomes your “main” UI */}
            <Stack.Screen name="MainTabs" component={MainTabs} />
          </Stack.Navigator>
          <Toast />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}
