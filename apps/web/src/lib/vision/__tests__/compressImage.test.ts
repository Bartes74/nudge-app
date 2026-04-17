// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'

// compressImage uses browser APIs — we mock them in jsdom
describe('compressImage', () => {
  const MAX_DIMENSION = 512

  function makeImageMock(width: number, height: number) {
    return {
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      width,
      height,
      set src(_: string) {
        // Trigger onload synchronously
        setTimeout(() => this.onload?.(), 0)
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
      toBlob: vi.fn(
        (cb: (blob: Blob | null) => void) => {
          cb(resultBlob)
        },
      ),
    }
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    // jsdom does not implement createObjectURL / revokeObjectURL
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock')
    URL.revokeObjectURL = vi.fn()
  })

  it('scales down an image wider than 512px', async () => {
    const imgMock = makeImageMock(1024, 768)
    const canvasMock = makeCanvasMock(new Blob(['img'], { type: 'image/jpeg' }))

    vi.spyOn(global, 'Image' as never).mockImplementation(() => imgMock as never)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return canvasMock as unknown as HTMLCanvasElement
      return document.createElement(tag)
    })

    const { compressImage } = await import('../compressImage')
    const result = await compressImage(new File(['data'], 'meal.jpg', { type: 'image/jpeg' }))

    expect(result).toBeInstanceOf(Blob)

    const ratio = Math.min(MAX_DIMENSION / 1024, MAX_DIMENSION / 768)
    expect(canvasMock.width).toBe(Math.round(1024 * ratio))
    expect(canvasMock.height).toBe(Math.round(768 * ratio))
    expect(canvasMock.width).toBeLessThanOrEqual(MAX_DIMENSION)
    expect(canvasMock.height).toBeLessThanOrEqual(MAX_DIMENSION)
  })

  it('does not upscale an image smaller than 512px', async () => {
    const imgMock = makeImageMock(300, 200)
    const canvasMock = makeCanvasMock(new Blob(['img'], { type: 'image/jpeg' }))

    vi.spyOn(global, 'Image' as never).mockImplementation(() => imgMock as never)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return canvasMock as unknown as HTMLCanvasElement
      return document.createElement(tag)
    })

    const { compressImage } = await import('../compressImage')
    const result = await compressImage(new File(['data'], 'small.jpg', { type: 'image/jpeg' }))

    expect(result).toBeInstanceOf(Blob)
    expect(canvasMock.width).toBe(300)
    expect(canvasMock.height).toBe(200)
  })

  it('rejects when toBlob returns null', async () => {
    const imgMock = makeImageMock(100, 100)
    const canvasMock = makeCanvasMock(null)

    vi.spyOn(global, 'Image' as never).mockImplementation(() => imgMock as never)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return canvasMock as unknown as HTMLCanvasElement
      return document.createElement(tag)
    })

    const { compressImage } = await import('../compressImage')
    await expect(
      compressImage(new File(['data'], 'broken.jpg', { type: 'image/jpeg' })),
    ).rejects.toThrow('Canvas toBlob returned null')
  })
})
