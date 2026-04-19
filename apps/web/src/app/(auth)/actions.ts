'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export type AuthActionState = { error?: string; success?: boolean } | null

const emailSchema = z.string().email()
const passwordSchema = z.string().min(8)

// ---- Sign Up ----

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!emailSchema.safeParse(email).success) {
    return { error: 'Podaj poprawny adres e-mail.' }
  }
  if (!passwordSchema.safeParse(password).success) {
    return { error: 'Hasło musi mieć minimum 8 znaków.' }
  }

  const supabase = await createClient()
  const appUrl = getAppUrl()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/verify`,
    },
  })

  if (error) return { error: mapAuthError(error.message) }

  redirect('/verify?email=' + encodeURIComponent(email))
}

// ---- Sign In ----

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = (formData.get('redirectTo') as string) || '/app'

  if (!emailSchema.safeParse(email).success) {
    return { error: 'Podaj poprawny adres e-mail.' }
  }
  if (!password) {
    return { error: 'Podaj hasło.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: mapAuthError(error.message) }

  revalidatePath('/', 'layout')
  redirect(redirectTo)
}

// ---- Magic Link ----

export async function magicLinkAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get('email') as string

  if (!emailSchema.safeParse(email).success) {
    return { error: 'Podaj poprawny adres e-mail.' }
  }

  const supabase = await createClient()
  const appUrl = getAppUrl()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/app`,
    },
  })

  if (error) return { error: mapAuthError(error.message) }

  return { success: true }
}

// ---- Forgot Password ----

export async function forgotPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get('email') as string

  if (!emailSchema.safeParse(email).success) {
    return { error: 'Podaj poprawny adres e-mail.' }
  }

  const supabase = await createClient()
  const appUrl = getAppUrl()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/app/profile?tab=password`,
  })

  if (error) return { error: mapAuthError(error.message) }

  return { success: true }
}

// ---- OAuth (Google / Apple) ----
// Not used with useActionState — called directly from form action prop.

export async function oauthAction(provider: 'google' | 'apple'): Promise<void> {
  const supabase = await createClient()
  const appUrl = getAppUrl()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${appUrl}/app`,
    },
  })

  if (error) {
    // Can't return error here (void) — Supabase dashboard will show it.
    // In practice this only fails if the provider is not configured.
    return
  }

  if (data.url) {
    redirect(data.url)
  }
}

// ---- Sign Out ----

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/signin')
}

// ---- Delete Account (soft delete) ----

export async function deleteAccountAction(): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from('users')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', user.id)

  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/signin?deleted=1')
}

// ---- Update Profile Settings ----

export type SettingsActionState = { error?: string; success?: boolean } | null

export async function updateUserSettingsAction(
  formData: FormData,
): Promise<SettingsActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Nie jesteś zalogowany.' }

  const timezone = (formData.get('timezone') as string) || null
  const locale = (formData.get('locale') as string) || null

  if (!timezone && !locale) return { success: true }

  const { error } = await supabase
    .from('users')
    .update({
      ...(timezone ? { timezone } : {}),
      ...(locale ? { locale } : {}),
    })
    .eq('id', user.id)

  if (error) return { error: 'Nie udało się zapisać ustawień.' }

  revalidatePath('/app/profile')
  return { success: true }
}

// ---- Helpers ----

function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Nieprawidłowy e-mail lub hasło.'
  }
  if (message.includes('Email not confirmed')) {
    return 'Potwierdź swój adres e-mail, zanim się zalogujesz.'
  }
  if (message.includes('Too many requests')) {
    return 'Za dużo prób. Odczekaj chwilę i spróbuj ponownie.'
  }
  if (message.includes('User already registered')) {
    return 'Ten adres e-mail jest już zarejestrowany. Zaloguj się.'
  }
  return 'Coś poszło nie tak. Spróbuj ponownie.'
}

function getAppUrl(): string {
  const configuredUrl = process.env['NEXT_PUBLIC_APP_URL']
  const requestHeaders = headers()
  const host =
    requestHeaders.get('x-forwarded-host') ??
    requestHeaders.get('host') ??
    process.env['VERCEL_URL'] ??
    null
  const proto =
    requestHeaders.get('x-forwarded-proto') ??
    (host?.includes('localhost') ? 'http' : 'https')

  if (host) {
    return `${proto}://${host}`
  }

  return configuredUrl ?? 'http://localhost:3000'
}
