// screen/(tabs)/signIn.js
import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, Image} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-message';
import {useDispatch} from 'react-redux';
import {signIn} from '../../redux/actions/authActions';

export default function SignIn({navigation}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const dispatch = useDispatch();

  const onSignIn = async () => {
    try {
      // dispatch your async thunk
      await dispatch(signIn({email, password}));
      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: `Welcome, ${email}!`,
      });
      navigation.replace('MainTabs');
    } catch (err) {
      const serverMsg =
        err.response?.data?.msg || err.response?.statusText || err.message;
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: serverMsg,
      });
    }
  };

  return (
    <View className="flex-1 bg-gray-50 px-4 pt-8 justify-center">
      <Image
        source={require('../../../assets/signin.png')}
        style={{width: '100%', height: 160, marginBottom: 16}}
        resizeMode="contain"
      />

      <View className="bg-white rounded-2xl p-6 shadow">
        <Text className="text-2xl font-bold mb-1">Login</Text>
        <Text className="text-gray-500 mb-6">Please sign in to continue.</Text>

        <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-2 mb-4">
          <Feather
            name="user"
            size={20}
            color="#9ca3af"
            style={{marginRight: 8}}
          />
          <TextInput
            className="flex-1 text-gray-700"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-2 mb-4">
          <Feather
            name="lock"
            size={20}
            color="#9ca3af"
            style={{marginRight: 8}}
          />
          <TextInput
            className="flex-1 text-gray-700"
            placeholder="Password"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Feather
              name={showPass ? 'eye-off' : 'eye'}
              size={20}
              color="#9ca3af"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-blue-700 rounded-lg py-3 mb-4"
          onPress={onSignIn}>
          <Text className="text-white text-center font-semibold">Sign In</Text>
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-gray-600">Don’t have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text className="text-blue-700 font-semibold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
