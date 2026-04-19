const TARGET_MAX_BYTES = 2.5 * 1024 * 1024
const MAX_DIMENSION = 1600
const MIN_DIMENSION = 512
const DIMENSION_REDUCTION_FACTOR = 0.85
const QUALITY_STEPS = [0.9, 0.82, 0.74, 0.66, 0.58]

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
        reject(new Error('Nie udało się przygotować zdjęcia.'))
        return
      }
      resolve(blob)
    }, type, quality)
  })
}

async function loadImage(file: File): Promise<LoadedImage> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file)
    return {
      width: bitmap.width,
      height: bitmap.height,
      source: bitmap,
      cleanup: () => bitmap.close(),
    }
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Nie udało się wczytać zdjęcia.'))
      img.src = objectUrl
    })

    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      source: image,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    }
  } catch (error) {
    URL.revokeObjectURL(objectUrl)
    throw error
  }
}

export async function prepareAvatarImage(file: File): Promise<File> {
  const needsResize = file.size > TARGET_MAX_BYTES

  try {
    const image = await loadImage(file)

    try {
      const withinTargetDimensions =
        Math.max(image.width, image.height) <= MAX_DIMENSION

      if (!needsResize && withinTargetDimensions) {
        return file
      }

      let currentMaxDimension = MAX_DIMENSION

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
          return file
        }

        context.drawImage(image.source, 0, 0, width, height)

        for (const quality of QUALITY_STEPS) {
          const blob = await blobFromCanvas(canvas, 'image/jpeg', quality)

          if (blob.size <= TARGET_MAX_BYTES) {
            const fileName = file.name.replace(/\.[^.]+$/, '') || 'avatar'
            return new File([blob], `${fileName}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
          }
        }

        currentMaxDimension = Math.floor(
          currentMaxDimension * DIMENSION_REDUCTION_FACTOR,
        )
      }

      return file
    } finally {
      image.cleanup()
    }
  } catch {
    return file
  }
}
