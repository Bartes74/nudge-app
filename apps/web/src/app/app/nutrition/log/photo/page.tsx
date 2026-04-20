'use client'

import { useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Camera, X, Send } from 'lucide-react'
import { PageBackLink, PageHero, PageSection } from '@/components/layout/PageHero'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { compressImage } from '@/lib/vision/compressImage'
import { Card } from '@/components/ui/card'

export default function MealPhotoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const showNote = searchParams.get('note') === '1'

  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  function clearPhoto() {
    setFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleSubmit() {
    if (!file) return
    setLoading(true)
    setError(null)

    try {
      const compressed = await compressImage(file)
      const compressedFile = new File([compressed], file.name, { type: 'image/jpeg' })

      const formData = new FormData()
      formData.append('photo', compressedFile)
      if (note.trim()) formData.append('note', note.trim())

      const res = await fetch('/api/meal/photo', {
        method: 'POST',
        body: formData,
      })

      if (res.status === 429) {
        const data = await res.json() as { message?: string }
        const message =
          data.message ?? 'Możesz dodać maksymalnie 6 zdjęć dziennie. Skorzystaj z opcji ręcznego wpisu.'
        setError(message)
        toast.error(message)
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        const message = data.error ?? 'Nie udało się przesłać zdjęcia'
        setError(message)
        toast.error(message)
        return
      }

      const { meal_log_id } = await res.json() as { meal_log_id: string }
      router.push(`/app/nutrition/log/${meal_log_id}`)
    } catch {
      const message = 'Wystąpił błąd podczas przesyłania'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <PageBackLink href="/app/nutrition/log" label="Jedzenie" />

      <PageHero
        eyebrow={showNote ? 'Zdjęcie + notatka' : 'Zdjęcie'}
        titleEmphasis="Sfotografuj"
        titleMain="posiłek."
        lede="Dodaj zdjęcie, a potem uzupełnij krótką notatkę tylko wtedy, gdy może pomóc lepiej odczytać porcję albo skład."
      />

      <PageSection
        number="01 — Zdjęcie"
        title="Dodaj zdjęcie posiłku"
        description="Najlepiej zrób jedno wyraźne zdjęcie z góry albo pod lekkim kątem."
        className="gap-4"
      >
        {!preview ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="ds-card group flex aspect-square w-full max-w-sm flex-col items-center justify-center gap-3 self-center border-dashed bg-[var(--bg-inset)] text-[var(--fg-secondary)] transition-[border-color,background-color,transform] duration-[var(--dur-fast)] ease-premium hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)] active:scale-[0.99]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] bg-[var(--fg-primary)] text-[var(--bg-canvas)]">
              <Camera className="h-6 w-6" aria-hidden="true" />
            </div>
            <span className="text-body-m font-semibold tracking-tight text-[var(--fg-primary)]">
              Dotknij, aby zrobić zdjęcie
            </span>
            <span className="text-body-s">lub wybierz z galerii</span>
          </button>
        ) : (
          <div className="relative w-full max-w-sm self-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] shadow-[var(--shadow-soft)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Podgląd posiłku" className="w-full object-cover" />
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-canvas)]/90 text-[var(--fg-primary)] shadow-[var(--shadow-soft)] backdrop-blur-md transition-transform hover:scale-105"
              aria-label="Usuń zdjęcie"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </PageSection>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {(showNote || preview) && (
        <PageSection
          number="02 — Notatka"
          title="Dodaj kontekst"
          description="To pole jest opcjonalne. Przydaje się tylko wtedy, gdy porcja albo skład nie są oczywiste ze zdjęcia."
          className="gap-4"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="meal-note" className="text-label uppercase text-muted-foreground">
              Notatka <span className="normal-case tracking-tight">(opcjonalnie)</span>
            </label>
            <Textarea
              id="meal-note"
              placeholder="np. „to był duży talerz”, „z sosem śmietanowym”…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              rows={3}
              className="resize-none"
            />
          </div>
        </PageSection>
      )}

      {error && (
        <Card variant="destructive" padding="sm" role="alert">
          <p className="text-body-m text-foreground">{error}</p>
        </Card>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!file || loading}
        isLoading={loading}
        className="w-full gap-2"
        size="hero"
      >
        {loading ? 'Przesyłam…' : (
          <>
            <Send className="h-4 w-4" />
            Analizuj posiłek
          </>
        )}
      </Button>
    </div>
  )
}
