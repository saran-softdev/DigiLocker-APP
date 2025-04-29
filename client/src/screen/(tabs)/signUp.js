import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, Image} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-message';
import {useDispatch} from 'react-redux';
import {signUp} from '../../redux/actions/authActions';
export default function SignUp({navigation}) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const dispatch = useDispatch();

  const handleSignUp = async () => {
    const missingFields = [];

    if (!username) missingFields.push('Username');
    if (!email) missingFields.push('Email');
    if (!password) missingFields.push('Password');
    if (!confirmPassword) missingFields.push('Confirm Password');

    if (missingFields.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Missing Fields',
        text2: `${missingFields.join(', ')} required`,
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address',
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Password Mismatch',
        text2: 'Passwords do not match',
      });
      return;
    }

    try {
      // dispatch your async thunk and wait for it to finish
      await dispatch(signUp({username, email, password}));

      // clear local form state
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // show success toast, then navigate
      Toast.show({
        type: 'success',
        text1: 'Registration Successful',
        text2: `Welcome, ${username}!`,
        // onHide is called when the toast disappears
        onHide: () => navigation.navigate('SignIn'),
      });

      console.log('User Data:', {username, email, password});
    } catch (err) {
      // prefer your API’s msg if present
      const serverMsg =
        err.response?.data?.msg || err.response?.statusText || err.message;

      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: serverMsg,
      });
    }
  };

  return (
    <View className="flex-1 bg-gray-50 px-4 pt-8 justify-center">
      <Image
        source={require('../../../assets/signup.png')}
        style={{width: '100%', height: 160, marginBottom: 16}}
        resizeMode="contain"
      />

      <View className="bg-white rounded-2xl p-6 shadow">
        <Text className="text-2xl font-bold mb-1">Register</Text>
        <Text className="text-gray-500 mb-6">Please register to login.</Text>

        {/* Username */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-2 mb-4">
          <Feather
            name="user"
            size={20}
            color="#9ca3af"
            style={{marginRight: 8}}
          />
          <TextInput
            className="flex-1 text-gray-700"
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />
        </View>

        {/* Email */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-2 mb-4">
          <Feather
            name="mail"
            size={20}
            color="#9ca3af"
            style={{marginRight: 8}}
          />
          <TextInput
            className="flex-1 text-gray-700"
            placeholder="Email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password */}
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

        {/* Confirm Password */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-2 mb-4">
          <Feather
            name="lock"
            size={20}
            color="#9ca3af"
            style={{marginRight: 8}}
          />
          <TextInput
            className="flex-1 text-gray-700"
            placeholder="Confirm Password"
            secureTextEntry={!showConfirmPass}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPass(!showConfirmPass)}>
            <Feather
              name={showConfirmPass ? 'eye-off' : 'eye'}
              size={20}
              color="#9ca3af"
            />
          </TouchableOpacity>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          className="bg-blue-700 rounded-lg py-3 mb-4"
          onPress={handleSignUp}>
          <Text className="text-white text-center font-semibold">Sign Up</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View className="flex-row justify-center">
          <Text className="text-gray-600">Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text className="text-blue-700 font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Toast Container */}
      <Toast />
    </View>
  );
}
