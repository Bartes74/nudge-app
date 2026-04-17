'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getUserRole } from '@/lib/auth/roles'
import { createAdminClient, ensureBootstrapAdminMetadata } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type CreateUserActionState =
  | {
      error?: string
      success?: string
    }
  | null

const createUserSchema = z.object({
  email: z.string().trim().email('Podaj poprawny adres e-mail.'),
  password: z
    .string()
    .min(8, 'Hasło musi mieć minimum 8 znaków.'),
  fullName: z.string().trim().max(80).optional(),
  role: z.enum(['user', 'tester', 'admin']),
})

export async function createUserAction(
  _prevState: CreateUserActionState,
  formData: FormData,
): Promise<CreateUserActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sesja wygasła. Zaloguj się ponownie.' }
  }

  await ensureBootstrapAdminMetadata({
    id: user.id,
    email: user.email,
    app_metadata: user.app_metadata as Record<string, unknown> | undefined,
  })

  const currentRole = getUserRole({
    email: user.email,
    app_metadata: user.app_metadata as Record<string, unknown> | undefined,
  })

  if (currentRole !== 'admin') {
    return { error: 'Tylko administrator może tworzyć użytkowników.' }
  }

  const parsed = createUserSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName') || undefined,
    role: formData.get('role'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane formularza.' }
  }

  const { email, password, fullName, role } = parsed.data
  const admin = createAdminClient()

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: role === 'user' ? {} : { role },
    user_metadata: fullName ? { full_name: fullName } : {},
  })

  if (error) {
    if (error.message.includes('already been registered')) {
      return { error: 'Ten adres e-mail jest już zarejestrowany.' }
    }

    return { error: 'Nie udało się utworzyć użytkownika. Sprawdź dane i spróbuj ponownie.' }
  }

  revalidatePath('/admin')

  return {
    success:
      role === 'user'
        ? `Utworzono konto ${email}. Użytkownik ma potwierdzony e-mail i aktywny trial.`
        : `Utworzono konto ${email} z rolą ${role}.`,
  }
}
