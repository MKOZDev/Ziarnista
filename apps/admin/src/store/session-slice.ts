import { createSlice } from '@reduxjs/toolkit';

/**
 * active: no known problem; whether a session exists is what GET /admin/me answers.
 * expired: the API rejected the session while the panel was in use.
 * signed-out: the admin logged out on purpose.
 */
export type SessionStatus = 'active' | 'expired' | 'signed-out';

const initialState: { status: SessionStatus } = { status: 'active' };

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    // Only from active: a late 401 must not turn a deliberate logout into "session expired"
    sessionExpired(state) {
      if (state.status === 'active') {
        state.status = 'expired';
      }
    },
    sessionEnded(state) {
      state.status = 'signed-out';
    },
    sessionStarted(state) {
      state.status = 'active';
    },
  },
  selectors: {
    selectSessionStatus: (state) => state.status,
  },
});

export const { sessionExpired, sessionEnded, sessionStarted } = sessionSlice.actions;
export const { selectSessionStatus } = sessionSlice.selectors;
