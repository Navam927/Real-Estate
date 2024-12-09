import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentUser: null,
  error: null,
  loading: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    signInStart: (state) => {
      state.loading = true;
    },
    signInSuccess: (state, action) => {
      state.currentUser = action.payload;
      state.loading = false;
      state.error = null;
    },
    signInFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    updateUserStart: (state) => {
      state.loading = true;
    },
    updateUserSuccess: (state, action) => {
      state.currentUser = action.payload;
      state.loading = false;
      state.error = null;
    },
    updateUserFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    deleteUserStart: (state) => {
      state.loading = true;
    },
    deleteUserSuccess: (state) => {
      state.currentUser = null;
      state.loading = false;
      state.error = null;
    },
    deleteUserFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    signOutUserStart: (state) => {
      state.loading = true;
    },
    signOutUserSuccess: (state) => {
      state.currentUser = null;
      state.loading = false;
      state.error = null;
    },
    signOutUserFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    toggle2faStart: (state) => {
      state.loading = true;
    },
    toggle2faSuccess: (state, action) => {
      state.currentUser = {
        ...state.currentUser,
        twoFAEnabled: action.payload.twoFAEnabled,
      };
      state.loading = false;
      state.error = null;
    },
    toggle2faFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    fetchUserStart : (state) => {
      state.loading = true;
    },
    fetchUserSuccess : (state, action) => {
      state.currentUser = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchUserFailure : (state, action) => {
      state.error = action.payload;
      state.loading = false;
    }
  },
});

export const {
  signInStart,
  signInSuccess,
  signInFailure,
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFailure,
  signOutUserStart,
  signOutUserSuccess,
  signOutUserFailure,
  toggle2faStart,
  toggle2faSuccess,
  toggle2faFailure,
  fetchUserStart,
  fetchUserFailure,
  fetchUserSuccess
} = userSlice.actions;

export default userSlice.reducer;
