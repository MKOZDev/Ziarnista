import { z } from 'zod';

// Mirror of the Prisma Role enum; a test in apps/api keeps them in sync
export const roleSchema = z.enum(['CUSTOMER', 'ADMIN']);

export type Role = z.infer<typeof roleSchema>;

export const PASSWORD_MIN_LENGTH = 12;
// Upper bound so nobody can make the server hash megabytes of input
export const PASSWORD_MAX_LENGTH = 128;

// Normalized before validation, so "Jan@Example.com " and "jan@example.com" are one account
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Nieprawidłowy adres email').max(254, 'Adres email jest za długi'));

export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Hasło musi mieć co najmniej ${PASSWORD_MIN_LENGTH} znaków`)
    .max(PASSWORD_MAX_LENGTH, `Hasło może mieć najwyżej ${PASSWORD_MAX_LENGTH} znaków`),
  name: z.string().trim().min(1, 'Podaj imię').max(100, 'Imię jest za długie'),
});

// No minimum length here: a policy change must not lock out accounts with older passwords,
// and a "too short" error would reveal the rule without checking the credentials.
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Podaj hasło').max(PASSWORD_MAX_LENGTH, 'Hasło jest za długie'),
});

// Body of /me, /admin/me, login and register; never contains the password hash
export const authUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string(),
  role: roleSchema,
  createdAt: z.iso.datetime(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
