
import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

import AuthReducer from "./AuthSlice";
import Common from "./CommonnSlice";
import favoritesReducer from "./favoritesSlice";

// Auth Persist Config
const authPersistConfig = {
  key: "auth",
  storage,
};



// Wrap reducers
const persistedAuthReducer = persistReducer(authPersistConfig, AuthReducer);


// Store
const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    common: Common,
    favorites: favoritesReducer,
  
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,

    }),

});

export const persister = persistStore(store);
export default store;