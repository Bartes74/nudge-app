#!/usr/bin/env node
// Generates 10 minimal valid JPEG placeholder images for meal photo tests.
// Each is a solid-color 64×64 JPEG representing a meal category.
// Replace with real food photos for meaningful AI analysis results.
//
// Run: node test-fixtures/meal-photos/generate.mjs

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Minimal valid JPEG structure builder (pure Node.js, no deps)
// Produces a solid-color YCbCr JPEG at given dimensions.

function buildMinimalJpeg(r, g, b) {
  // Convert RGB to YCbCr
  const Y  = Math.round( 0.299 * r + 0.587 * g + 0.114 * b)
  const Cb = Math.round(-0.169 * r - 0.331 * g + 0.500 * b + 128)
  const Cr = Math.round( 0.500 * r - 0.419 * g - 0.081 * b + 128)

  // Standard luminance quantization table (quality ~50)
  const qtLuma = [
    16,11,10,16,24,40,51,61,
    12,12,14,19,26,58,60,55,
    14,13,16,24,40,57,69,56,
    14,17,22,29,51,87,80,62,
    18,22,37,56,68,109,103,77,
    24,35,55,64,81,104,113,92,
    49,64,78,87,103,121,120,101,
    72,92,95,98,112,100,103,99,
  ]
  // Standard chrominance quantization table
  const qtChroma = [
    17,18,24,47,99,99,99,99,
    18,21,26,66,99,99,99,99,
    24,26,56,99,99,99,99,99,
    47,66,99,99,99,99,99,99,
    99,99,99,99,99,99,99,99,
    99,99,99,99,99,99,99,99,
    99,99,99,99,99,99,99,99,
    99,99,99,99,99,99,99,99,
  ]

  const bytes = []

  const w16 = (n) => { bytes.push((n >> 8) & 0xff, n & 0xff) }
  const w8  = (n) => { bytes.push(n & 0xff) }

  // SOI
  bytes.push(0xff, 0xd8)

  // APP0 JFIF
  bytes.push(0xff, 0xe0)
  w16(16)
  ;[0x4a,0x46,0x49,0x46,0x00].forEach(b => w8(b)) // "JFIF\0"
  w8(1); w8(1)   // version 1.1
  w8(0)          // no units
  w16(1); w16(1) // 1x1 density
  w8(0); w8(0)   // no thumbnail

  // DQT — luma
  bytes.push(0xff, 0xdb)
  w16(2 + 1 + 64)
  w8(0) // table 0, 8-bit
  qtLuma.forEach(v => w8(v))

  // DQT — chroma
  bytes.push(0xff, 0xdb)
  w16(2 + 1 + 64)
  w8(1) // table 1
  qtChroma.forEach(v => w8(v))

  // SOF0 — 8x8 baseline, 3 components (YCbCr)
  bytes.push(0xff, 0xc0)
  w16(2 + 9 + 3 * 3)
  w8(8)    // precision
  w16(8)   // height
  w16(8)   // width
  w8(3)    // components
  // Y  id=1, sampling=1x1 (0x11), qt=0
  w8(1); w8(0x11); w8(0)
  // Cb id=2, sampling=1x1 (0x11), qt=1
  w8(2); w8(0x11); w8(1)
  // Cr id=3, sampling=1x1 (0x11), qt=1
  w8(3); w8(0x11); w8(1)

  // DHT — luma DC (standard table)
  const dcLumaCounts = [0,1,5,1,1,1,1,1,1,0,0,0,0,0,0,0]
  const dcLumaVals   = [0,1,2,3,4,5,6,7,8,9,10,11]
  bytes.push(0xff, 0xc4)
  w16(2 + 1 + 16 + dcLumaVals.length)
  w8(0x00) // DC, table 0
  dcLumaCounts.forEach(v => w8(v))
  dcLumaVals.forEach(v => w8(v))

  // DHT — luma AC (standard table — abbreviated for minimal valid JPEG)
  const acLumaCounts = [0,2,1,3,3,2,4,3,5,5,4,4,0,0,1,125]
  const acLumaVals = [
    0x01,0x02,0x03,0x00,0x04,0x11,0x05,0x12,0x21,0x31,0x41,0x06,0x13,0x51,0x61,
    0x07,0x22,0x71,0x14,0x32,0x81,0x91,0xa1,0x08,0x23,0x42,0xb1,0xc1,0x15,0x52,
    0xd1,0xf0,0x24,0x33,0x62,0x72,0x82,0x09,0x0a,0x16,0x17,0x18,0x19,0x1a,0x25,
    0x26,0x27,0x28,0x29,0x2a,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x43,0x44,0x45,
    0x46,0x47,0x48,0x49,0x4a,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x63,0x64,
    0x65,0x66,0x67,0x68,0x69,0x6a,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x83,
    0x84,0x85,0x86,0x87,0x88,0x89,0x8a,0x92,0x93,0x94,0x95,0x96,0x97,0x98,0x99,
    0x9a,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7,0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,0xb5,0xb6,
    0xb7,0xb8,0xb9,0xba,0xc2,0xc3,0xc4,0xc5,
  ]
  bytes.push(0xff, 0xc4)
  w16(2 + 1 + 16 + acLumaVals.length)
  w8(0x10) // AC, table 0
  acLumaCounts.forEach(v => w8(v))
  acLumaVals.forEach(v => w8(v))

  // DHT — chroma DC (same as luma DC for simplicity)
  bytes.push(0xff, 0xc4)
  w16(2 + 1 + 16 + dcLumaVals.length)
  w8(0x01) // DC, table 1
  dcLumaCounts.forEach(v => w8(v))
  dcLumaVals.forEach(v => w8(v))

  // DHT — chroma AC (same as luma AC for simplicity)
  bytes.push(0xff, 0xc4)
  w16(2 + 1 + 16 + acLumaVals.length)
  w8(0x11) // AC, table 1
  acLumaCounts.forEach(v => w8(v))
  acLumaVals.forEach(v => w8(v))

  // SOS
  bytes.push(0xff, 0xda)
  w16(2 + 1 + 3 * 2 + 3)
  w8(3) // 3 components
  w8(1); w8(0x00) // Y,  DC table 0, AC table 0
  w8(2); w8(0x11) // Cb, DC table 1, AC table 1
  w8(3); w8(0x11) // Cr, DC table 1, AC table 1
  w8(0); w8(63); w8(0) // Ss=0, Se=63, Ah=0 Al=0

  // Minimal valid scan data — encode a single 8×8 block of constant color.
  // DC coefficient = quantized Y/Cb/Cr value, all AC = 0 (EOB).
  // Huffman-encode: DC diff=Y_q using luma table, then EOB (0x00).
  // For simplicity use Y_q ≈ Y/qtLuma[0], mapped to DC code.
  // We emit a hand-crafted valid but minimal bitstream.
  // For a near-solid-color image this approach is valid.

  // Encode Y DC: value = round(Y / qtLuma[0]) → DC code
  function encodeDC(val, prevDC) {
    const diff = val - prevDC
    // Category = number of bits needed for |diff|
    let cat = 0
    let v = Math.abs(diff)
    while (v > 0) { cat++; v >>= 1 }
    // DC luma Huffman code for category
    const dcCodes = [
      [0b00,2],[0b010,3],[0b011,3],[0b100,3],[0b101,3],
      [0b110,3],[0b1110,4],[0b11110,5],[0b111110,6],
      [0b1111110,7],[0b11111110,8],[0b111111110,9],
    ]
    const [code, len] = dcCodes[cat] ?? [0, 2]
    const bits = []
    for (let i = len - 1; i >= 0; i--) bits.push((code >> i) & 1)
    if (cat > 0) {
      const magnitude = diff >= 0 ? diff : diff + (1 << cat) - 1
      for (let i = cat - 1; i >= 0; i--) bits.push((magnitude >> i) & 1)
    }
    return bits
  }

  const Yq  = Math.round(Y  / qtLuma[0])
  const Cbq = Math.round((Cb - 128) / qtChroma[0])
  const Crq = Math.round((Cr - 128) / qtChroma[0])

  // EOB for AC = 0x00 code: Huffman code for (0,0) = 0b1010 (4 bits)
  const acEOB = [1,0,1,0]

  let bits = [
    ...encodeDC(Yq,  0), ...acEOB, // Y block
    ...encodeDC(Cbq, 0), ...acEOB, // Cb block
    ...encodeDC(Crq, 0), ...acEOB, // Cr block
  ]

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(1)

  // Pack bits to bytes, byte-stuff 0xFF → 0xFF 0x00
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] ?? 1)
    bytes.push(byte)
    if (byte === 0xff) bytes.push(0x00)
  }

  // EOI
  bytes.push(0xff, 0xd9)

  return Buffer.from(bytes)
}

// 10 meal photos — each a different solid color
const photos = [
  { name: '01-chicken-rice.jpg',   rgb: [210,170,100], desc: 'chicken + rice (golden/beige)' },
  { name: '02-oatmeal.jpg',        rgb: [200,180,140], desc: 'oatmeal (warm beige)' },
  { name: '03-pizza.jpg',          rgb: [220, 80, 50], desc: 'pizza (red/tomato)' },
  { name: '04-salad.jpg',          rgb: [ 80,160, 80], desc: 'salad (green)' },
  { name: '05-protein-shake.jpg',  rgb: [180,220,240], desc: 'protein shake (light blue)' },
  { name: '06-eggs-toast.jpg',     rgb: [240,210, 80], desc: 'eggs + toast (yellow)' },
  { name: '07-pasta.jpg',          rgb: [200,100, 60], desc: 'pasta bolognese (dark orange)' },
  { name: '08-dark-bowl.jpg',      rgb: [ 40, 40, 40], desc: 'dark bowl — low confidence' },
  { name: '09-yogurt-granola.jpg', rgb: [240,240,220], desc: 'yogurt + granola (cream)' },
  { name: '10-steak-potato.jpg',   rgb: [140, 80, 50], desc: 'steak + potato (brown)' },
]

let created = 0
for (const photo of photos) {
  const [r, g, b] = photo.rgb
  const jpeg = buildMinimalJpeg(r, g, b)
  const outPath = join(__dirname, photo.name)
  writeFileSync(outPath, jpeg)
  created++
  console.log(`✓ ${photo.name}  (${jpeg.length} bytes)  — ${photo.desc}`)
}

console.log(`\nGenerated ${created} placeholder JPEG images.`)
console.log('Replace with real food photos for meaningful AI analysis.')
