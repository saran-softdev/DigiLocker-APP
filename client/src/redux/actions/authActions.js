import {
  SIGNUP_REQUEST,
  SIGNUP_SUCCESS,
  SIGNUP_FAIL,
  SIGNIN_REQUEST,
  SIGNIN_SUCCESS,
  SIGNIN_FAIL,
  LOGOUT,
} from '../actionTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../lib/apiClient'; // ← centralized client

// Sign Up
export const signUp =
  ({username, email, password}) =>
  async dispatch => {
    dispatch({type: SIGNUP_REQUEST});
    try {
      const {data} = await apiClient.post('/auth/register', {
        username,
        email,
        password,
      });
      dispatch({
        type: SIGNUP_SUCCESS,
        payload: {user: data.user, token: data.token},
      });
      return data;
    } catch (error) {
      dispatch({
        type: SIGNUP_FAIL,
        payload: error.response?.data?.msg || error.message,
      });
      throw error;
    }
  };

// Sign In
export const signIn =
  ({email, password}) =>
  async dispatch => {
    dispatch({type: SIGNIN_REQUEST});
    try {
      const {data} = await apiClient.post('/auth/login', {email, password});

      // persist session
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      await AsyncStorage.setItem('token', data.token);
      apiClient.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${data.token}`;

      // correctly read it back
      const userJson = await AsyncStorage.getItem('user');
      const storedUser = userJson ? JSON.parse(userJson) : null;
      console.log('stored user:', storedUser);
      dispatch({
        type: SIGNIN_SUCCESS,
        payload: {user: data.user, token: data.token},
      });
    } catch (error) {
      dispatch({
        type: SIGNIN_FAIL,
        payload: error.response?.data?.msg || error.message,
      });
    }
  };

// Logout
export const logout = () => async dispatch => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      await apiClient.post('/auth/logout');
    }
  } catch (e) {
    console.warn('Logout sync failed:', e.message);
  }

  await AsyncStorage.removeItem('user');
  await AsyncStorage.removeItem('token');
  delete apiClient.defaults.headers.common['Authorization'];

  dispatch({ type: LOGOUT });
};

