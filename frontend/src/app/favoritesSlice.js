

import { createSlice } from "@reduxjs/toolkit";

// Helper to sync with localStorage
const loadFavorites = () => {
  try {
    const data = localStorage.getItem("favorites");
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveFavorites = (arr) => {
  try {
    localStorage.setItem("favorites", JSON.stringify(arr));
  } catch (e) {
    // Ignore
  }
};

const initialState = {
  items: loadFavorites(),
};

const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    toggleFavorite(state, action) {
      const id = action.payload;
      if (state.items.includes(id)) {
        state.items = state.items.filter((item) => item !== id);
      } else {
        state.items.push(id);
      }
      saveFavorites(state.items);
    },
    setFavorites(state, action) {
      state.items = action.payload;
      saveFavorites(state.items);
    },
  },
});

export const { toggleFavorite, setFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;