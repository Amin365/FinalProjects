import React from "react";
import { render } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import AuthReducer from "../app/AuthSlice";
import Common from "../app/CommonnSlice";
import favoritesReducer from "../app/favoritesSlice";

/**
 * Creates a fresh Redux store without persistence for testing.
 * @param {object} preloadedState - initial state to seed the store
 */
export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      auth: AuthReducer,
      common: Common,
      favorites: favoritesReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }),
  });
}

/**
 * Custom render that wraps the UI in all required providers.
 * @param {React.ReactElement} ui
 * @param {object} options
 * @param {object} options.preloadedState - pre-seeded Redux state
 * @param {string} options.initialPath - initial URL path (default "/")
 */
export function renderWithProviders(
  ui,
  { preloadedState = {}, initialPath = "/", ...renderOptions } = {}
) {
  const store = createTestStore(preloadedState);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, retryDelay: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[initialPath]}>
            {children}
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>
    );
  }

  return {
    store,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
