import { combineSlices, configureStore } from '@reduxjs/toolkit';
import { baseApi } from './base-api';
import { sessionSlice } from './session-slice';

const rootReducer = combineSlices(baseApi, sessionSlice);

/** A function, not a singleton: on the server a shared store would leak data between requests. */
export function makeStore() {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore['dispatch'];
