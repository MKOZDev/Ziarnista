import type { AuthUser } from '@ziarnista/shared';
import { http, HttpResponse } from 'msw/http';
import { setupServer } from 'msw/node';

/** Tests add the handlers they need with server.use(); an unhandled request fails the test. */
export const server = setupServer();

// location.origin in jsdom, where the relative URLs of fetchBaseQuery resolve
export const API = 'http://localhost:3000/api/v1';

export const adminUser: AuthUser = {
  id: '6f1c2b1e-3f4a-4d6b-9a57-0a9b7c1d2e3f',
  email: 'admin@ziarnista.pl',
  name: 'Anna Nowak',
  role: 'ADMIN',
  createdAt: '2026-01-15T10:00:00.000Z',
};

export const meOk = http.get(`${API}/admin/me`, () => HttpResponse.json(adminUser));
