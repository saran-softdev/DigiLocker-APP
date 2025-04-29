import {
  SIGNUP_REQUEST,
  SIGNUP_SUCCESS,
  SIGNUP_FAIL,
  SIGNIN_REQUEST,
  SIGNIN_SUCCESS,
  SIGNIN_FAIL,
  LOGOUT,
} from '../actionTypes';

const initialState = {
  loading: false,
  user: null,
  token: null,
  error: null,
};

export default function authReducer(state = initialState, action) {
  switch (action.type) {
    case SIGNUP_REQUEST:
    case SIGNIN_REQUEST:
      return {...state, loading: true, error: null};

    case SIGNUP_SUCCESS:
    case SIGNIN_SUCCESS:
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
      };

    case SIGNUP_FAIL:
    case SIGNIN_FAIL:
      return {...state, loading: false, error: action.payload};

    case LOGOUT:
      return {...state, user: null, token: null};

    default:
      return state;
  }
}
