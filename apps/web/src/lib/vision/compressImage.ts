const TARGET_MAX_BYTES = 2.5 * 1024 * 1024
const UPLOAD_MAX_BYTES = 15 * 1024 * 1024
const MAX_DIMENSION = 1600
const MIN_DIMENSION = 512
const DIMENSION_REDUCTION_FACTOR = 0.85
const QUALITY_STEPS = [0.9, 0.82, 0.74, 0.66, 0.58]
const PASSTHROUGH_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export class MealPhotoPreparationError extends Error {
  constructor(
    public readonly code:
      | 'IMAGE_DECODE_FAILED'
      | 'IMAGE_TOO_LARGE_AFTER_PREPARATION',
    message: string,
  ) {
    super(message)
    this.name = 'MealPhotoPreparationError'
  }
}

type LoadedImage = {
  width: number
  height: number
  source: CanvasImageSource
  cleanup: () => void
}

function scaleSize(width: number, height: number, maxDimension: number) {
  const longestSide = Math.max(width, height)
  const ratio = longestSide > maxDimension ? maxDimension / longestSide : 1

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

function blobFromCanvas(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Nie udało się przygotować zdjęcia posiłku.'))
        return
      }
      resolve(blob)
    }, type, quality)
  })
}

async function loadImage(file: File): Promise<LoadedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      return {
        width: bitmap.width,
        height: bitmap.height,
        source: bitmap,
        cleanup: () => bitmap.close(),
      }
    } catch {
      // Fall through to HTML image loading for formats rejected by bitmap decoding.
    }
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Nie udało się wczytać zdjęcia posiłku.'))
      img.src = objectUrl
    })

    return {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      source: image,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    }
  } catch (error) {
    URL.revokeObjectURL(objectUrl)

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('Nie udało się odczytać zdjęcia posiłku.'))
          return
        }
        resolve(reader.result)
      }
      reader.onerror = () => reject(new Error('Nie udało się odczytać zdjęcia posiłku.'))
      reader.readAsDataURL(file)
    })

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(error)
      img.src = dataUrl
    })

    return {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      source: image,
      cleanup: () => undefined,
    }
  }
}

function fileFromBlob(blob: Blob, originalFile: File): File {
  const fileName = originalFile.name.replace(/\.[^.]+$/, '') || 'meal-photo'
  return new File([blob], `${fileName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}

export async function compressImage(file: File): Promise<File> {
  const needsResize = file.size > TARGET_MAX_BYTES

  try {
    const image = await loadImage(file)

    try {
      const withinTargetDimensions =
        Math.max(image.width, image.height) <= MAX_DIMENSION
      const canKeepOriginal =
        PASSTHROUGH_TYPES.has(file.type) && !needsResize && withinTargetDimensions

      if (canKeepOriginal) {
        return file
      }

      let currentMaxDimension = MAX_DIMENSION
      let bestBlob: Blob | null = null

      while (currentMaxDimension >= MIN_DIMENSION) {
        const { width, height } = scaleSize(
          image.width,
          image.height,
          currentMaxDimension,
        )
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const context = canvas.getContext('2d')
        if (!context) {
          break
        }

        context.drawImage(image.source, 0, 0, width, height)

        for (const quality of QUALITY_STEPS) {
          const blob = await blobFromCanvas(canvas, 'image/jpeg', quality)
          if (!bestBlob || blob.size < bestBlob.size) {
            bestBlob = blob
          }

          if (blob.size <= TARGET_MAX_BYTES) {
            return fileFromBlob(blob, file)
          }
        }

        currentMaxDimension = Math.floor(
          currentMaxDimension * DIMENSION_REDUCTION_FACTOR,
        )
      }

      if (bestBlob && bestBlob.size <= UPLOAD_MAX_BYTES) {
        return fileFromBlob(bestBlob, file)
      }

      if (file.size <= UPLOAD_MAX_BYTES) {
        return file
      }

      throw new MealPhotoPreparationError(
        'IMAGE_TOO_LARGE_AFTER_PREPARATION',
        'Zdjęcie po zmniejszeniu nadal jest za duże. Wybierz inne albo bardziej je przytnij.',
      )
    } finally {
      image.cleanup()
    }
  } catch (error) {
    if (error instanceof MealPhotoPreparationError) {
      throw error
    }

    if (file.size <= UPLOAD_MAX_BYTES) {
      return file
    }

    throw new MealPhotoPreparationError(
      'IMAGE_DECODE_FAILED',
      'Nie udało się przygotować tego zdjęcia na telefonie. Wybierz inne albo zapisz je wcześniej jako JPG lub PNG.',
    )
  }
}
