'use client'

import { useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Camera, X, Send } from 'lucide-react'
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
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 pt-6 pb-24 animate-stagger">
      <Link
        href="/app/nutrition/log"
        className="inline-flex w-fit items-center gap-1.5 text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Wróć
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-label uppercase text-muted-foreground">
          {showNote ? 'Zdjęcie + notatka' : 'Zdjęcie'}
        </p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
          <span className="font-display italic text-muted-foreground">Sfotografuj</span>
          <br />
          <span className="font-sans font-semibold">posiłek.</span>
        </h1>
      </header>

      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group flex aspect-square w-full max-w-sm flex-col items-center justify-center gap-3 self-center rounded-2xl border-2 border-dashed border-border bg-surface-2/50 text-muted-foreground transition-[border-color,background-color,transform] duration-200 ease-premium hover:border-foreground/40 hover:bg-surface-2 active:scale-[0.99]"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
            <Camera className="h-6 w-6" aria-hidden="true" />
          </div>
          <span className="text-body-m font-semibold tracking-tight text-foreground">
            Dotknij, aby zrobić zdjęcie
          </span>
          <span className="text-body-s">lub wybierz z galerii</span>
        </button>
      ) : (
        <div className="relative w-full max-w-sm self-center overflow-hidden rounded-2xl border border-border shadow-lift">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Podgląd posiłku" className="w-full object-cover" />
          <button
            type="button"
            onClick={clearPhoto}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-lift backdrop-blur-md transition-transform hover:scale-105"
            aria-label="Usuń zdjęcie"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {(showNote || preview) && (
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
