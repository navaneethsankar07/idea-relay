import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  isInitialized: boolean;
  theme: 'light' | 'dark' | 'system';
}

const initialState: AppState = {
  isInitialized: true,
  theme: 'system',
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<AppState['theme']>) => {
      state.theme = action.payload;
    },
  },
});

export const { setTheme } = appSlice.actions;
export default appSlice.reducer;
