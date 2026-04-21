// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('compressImage', () => {
  const MAX_DIMENSION = 1600

  function makeImageMock(
    width: number,
    height: number,
    options?: { fail?: boolean },
  ) {
    return {
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      width,
      height,
      naturalWidth: width,
      naturalHeight: height,
      set src(_: string) {
        setTimeout(() => {
          if (options?.fail) {
            this.onerror?.()
            return
          }
          this.onload?.()
        }, 0)
      },
    }
  }

  function makeCanvasMock(resultBlob: Blob | null) {
    return {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue({
        drawImage: vi.fn(),
      }),
      toBlob: vi.fn((cb: (blob: Blob | null) => void) => {
        cb(resultBlob)
      }),
    }
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock')
    URL.revokeObjectURL = vi.fn()
    vi.stubGlobal('createImageBitmap', undefined)
  })

  it('scales down an image wider than 1600px', async () => {
    const imgMock = makeImageMock(3200, 2400)
    const canvasMock = makeCanvasMock(new Blob(['img'], { type: 'image/jpeg' }))

    vi.spyOn(global, 'Image' as never).mockImplementation(() => imgMock as never)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return canvasMock as unknown as HTMLCanvasElement
      return document.createElement(tag)
    })

    const { compressImage } = await import('../compressImage')
    const result = await compressImage(new File(['data'], 'meal.jpg', { type: 'image/jpeg' }))

    expect(result).toBeInstanceOf(File)

    const ratio = Math.min(MAX_DIMENSION / 3200, MAX_DIMENSION / 2400)
    expect(canvasMock.width).toBe(Math.round(3200 * ratio))
    expect(canvasMock.height).toBe(Math.round(2400 * ratio))
    expect(canvasMock.width).toBeLessThanOrEqual(MAX_DIMENSION)
    expect(canvasMock.height).toBeLessThanOrEqual(MAX_DIMENSION)
  })

  it('keeps a small supported image without recompressing', async () => {
    const imgMock = makeImageMock(300, 200)
    const sourceFile = new File(['data'], 'small.jpg', { type: 'image/jpeg' })

    vi.spyOn(global, 'Image' as never).mockImplementation(() => imgMock as never)

    const { compressImage } = await import('../compressImage')
    const result = await compressImage(sourceFile)

    expect(result).toBe(sourceFile)
  })

  it('rejects when toBlob returns null for a large image', async () => {
    const imgMock = makeImageMock(3000, 2000)
    const canvasMock = makeCanvasMock(null)
    const oversizedFile = new File(
      [new Uint8Array(16 * 1024 * 1024)],
      'broken.jpg',
      { type: 'image/jpeg' },
    )

    vi.spyOn(global, 'Image' as never).mockImplementation(() => imgMock as never)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return canvasMock as unknown as HTMLCanvasElement
      return document.createElement(tag)
    })

    const { compressImage } = await import('../compressImage')
    await expect(
      compressImage(oversizedFile),
    ).rejects.toThrow(
      'Nie udało się przygotować tego zdjęcia na telefonie. Wybierz inne albo zapisz je wcześniej jako JPG lub PNG.',
    )
  })

  it('falls back to the original file when decoding fails but upload size is acceptable', async () => {
    let imageCalls = 0
    const sourceFile = new File(['data'], 'meal.heic', { type: 'image/heic' })

    vi.spyOn(global, 'Image' as never).mockImplementation(() => {
      imageCalls += 1
      return makeImageMock(0, 0, { fail: true }) as never
    })

    class FileReaderMock {
      result: string | ArrayBuffer | null = null
      onload: null | (() => void) = null
      onerror: null | (() => void) = null

      readAsDataURL() {
        this.result = 'data:image/heic;base64,AAAA'
        setTimeout(() => this.onload?.(), 0)
      }
    }

    vi.stubGlobal('FileReader', FileReaderMock)

    const { compressImage } = await import('../compressImage')
    const result = await compressImage(sourceFile)

    expect(imageCalls).toBe(2)
    expect(result).toBe(sourceFile)
  })
})
