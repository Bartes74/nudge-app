'use client'

import { useState, useTransition } from 'react'
import type { User } from '@supabase/supabase-js'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { LogOut, Trash2, Moon, Globe, Clock, AlertTriangle } from 'lucide-react'
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
import { Card, CardEyebrow } from '@/components/ui/card'
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
    <div className="flex flex-col gap-5">
      <Card variant="default" padding="md" className="flex items-center gap-4">
        <Avatar className="h-14 w-14 ring-1 ring-border">
          <AvatarImage
            src={user.user_metadata?.['avatar_url'] as string | undefined}
            alt="Avatar"
          />
          <AvatarFallback className="font-display text-display-m">
            {getInitials(user.email ?? 'NU')}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-m font-semibold tracking-tight">
            {(user.user_metadata?.['full_name'] as string | undefined) ?? user.email}
          </p>
          <p className="truncate font-mono text-body-s text-muted-foreground">{user.email}</p>
        </div>
      </Card>

      <Card variant="default" padding="md">
        <CardEyebrow>Preferencje</CardEyebrow>
        <div className="mt-4 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Moon className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="dark-mode" className="cursor-pointer text-body-m font-medium">
                Ciemny motyw
              </Label>
            </div>
            <Switch
              id="dark-mode"
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-2 text-label uppercase text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
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

          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-2 text-label uppercase text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
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
        </div>
      </Card>

      <Card variant="recessed" padding="md">
        <CardEyebrow>Konto</CardEyebrow>
        <div className="mt-3 flex flex-col gap-2.5">
          <form action={signOutAction}>
            <Button type="submit" variant="outline" className="w-full gap-2">
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
            <Card variant="destructive" padding="md" className="flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="flex flex-col gap-1">
                  <p className="text-body-m font-semibold text-destructive">Jesteś pewny/a?</p>
                  <p className="text-body-s text-muted-foreground">
                    Twoje dane zostaną zachowane przez 30 dni — możesz przywrócić konto, kontaktując się
                    z nami. Po tym czasie zostaną trwale usunięte.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <form action={deleteAccountAction} className="flex-1">
                  <Button type="submit" variant="destructive" size="sm" className="w-full">
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
            </Card>
          )}
        </div>
      </Card>
    </div>
  )
}
