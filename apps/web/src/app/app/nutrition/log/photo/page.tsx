'use client'

import { useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Camera, X, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { compressImage } from '@/lib/vision/compressImage'

export default function MealPhotoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const showNote = searchParams.get('note') === '1'

  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

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
        toast.error(data.message ?? 'Dzienny limit zdjęć osiągnięty')
        return
      }

      if (!res.ok) {
        toast.error('Nie udało się przesłać zdjęcia')
        return
      }

      const { meal_log_id } = await res.json() as { meal_log_id: string }
      router.push(`/app/nutrition/log/${meal_log_id}`)
    } catch {
      toast.error('Wystąpił błąd podczas przesyłania')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">
        {showNote ? 'Zdjęcie + notatka' : 'Zdjęcie posiłku'}
      </h1>

      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square w-full max-w-sm flex-col items-center justify-center gap-3 self-center rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50"
        >
          <Camera className="h-10 w-10" />
          <span className="text-sm font-medium">Dotknij, aby zrobić zdjęcie</span>
          <span className="text-xs">lub wybierz z galerii</span>
        </button>
      ) : (
        <div className="relative w-full max-w-sm self-center overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Podgląd posiłku" className="w-full object-cover" />
          <button
            type="button"
            onClick={clearPhoto}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
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
        <Textarea
          placeholder="Notatka dla AI (opcjonalnie): np. 'to był duży talerz', 'z sosem śmietanowym'"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
          rows={3}
          className="resize-none"
        />
      )}

      <Button
        onClick={handleSubmit}
        disabled={!file || loading}
        className="w-full gap-2"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Przesyłam...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Analizuj posiłek
          </>
        )}
      </Button>
    </div>
  )
}
