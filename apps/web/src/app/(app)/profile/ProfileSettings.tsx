'use client'

import { useState, useTransition } from 'react'
import type { User } from '@supabase/supabase-js'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { LogOut, Trash2, Moon, Globe, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  signOutAction,
  deleteAccountAction,
  updateUserSettingsAction,
} from '@/app/(auth)/actions'

const TIMEZONES = [
  { value: 'Europe/Warsaw', label: 'Europa/Warszawa (CET/CEST)' },
  { value: 'Europe/London', label: 'Europa/Londyn (GMT/BST)' },
  { value: 'Europe/Berlin', label: 'Europa/Berlin (CET/CEST)' },
  { value: 'America/New_York', label: 'Ameryka/Nowy Jork (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Ameryka/Los Angeles (PST/PDT)' },
  { value: 'UTC', label: 'UTC' },
]

const LOCALES = [
  { value: 'pl-PL', label: 'Polski' },
  { value: 'en-US', label: 'English (US)' },
]

type Props = {
  user: User
  timezone: string
  locale: string
}

function getInitials(email: string): string {
  return email.slice(0, 2).toUpperCase()
}

export function ProfileSettings({ user, timezone, locale }: Props) {
  const { theme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function handleTimezoneChange(value: string) {
    const formData = new FormData()
    formData.set('timezone', value)
    startTransition(async () => {
      const result = await updateUserSettingsAction(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Zapisano.')
      }
    })
  }

  function handleLocaleChange(value: string) {
    const formData = new FormData()
    formData.set('locale', value)
    startTransition(async () => {
      const result = await updateUserSettingsAction(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Zapisano.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Account header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage
            src={user.user_metadata?.['avatar_url'] as string | undefined}
            alt="Avatar"
          />
          <AvatarFallback className="text-lg">
            {getInitials(user.email ?? 'NU')}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">
            {(user.user_metadata?.['full_name'] as string | undefined) ??
              user.email}
          </p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Preferences */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Preferencje
        </h2>

        {/* Dark mode */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="dark-mode" className="cursor-pointer">
              Ciemny motyw
            </Label>
          </div>
          <Switch
            id="dark-mode"
            checked={theme === 'dark'}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          />
        </div>

        {/* Timezone */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Strefa czasowa
          </Label>
          <Select
            defaultValue={timezone}
            onValueChange={handleTimezoneChange}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Locale */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Język
          </Label>
          <Select
            defaultValue={locale}
            onValueChange={handleLocaleChange}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <div className="h-px bg-border" />

      {/* Account actions */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Konto
        </h2>

        <form action={signOutAction}>
          <Button
            type="submit"
            variant="outline"
            className="w-full gap-2"
          >
            <LogOut className="h-4 w-4" />
            Wyloguj się
          </Button>
        </form>

        {!showDeleteConfirm ? (
          <Button
            variant="ghost"
            className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
            Usuń konto
          </Button>
        ) : (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <p className="text-sm text-destructive font-medium">
              Jesteś pewny/a?
            </p>
            <p className="text-xs text-muted-foreground">
              Twoje dane zostaną zachowane przez 30 dni — możesz przywrócić
              konto, kontaktując się z nami. Po tym czasie zostaną trwale
              usunięte.
            </p>
            <div className="flex gap-2">
              <form action={deleteAccountAction} className="flex-1">
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  Tak, usuń konto
                </Button>
              </form>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Anuluj
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
