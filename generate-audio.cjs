// 生成钢琴曲风格背景音乐（River Flows in You 风格）
const fs = require('fs')
const path = require('path')

const sampleRate = 22050
const duration = 16  // 16秒循环
const numSamples = sampleRate * duration
const numChannels = 1
const bitsPerSample = 16
const dataSize = numSamples * numChannels * (bitsPerSample / 8)

// WAV header
const buf = Buffer.alloc(44 + dataSize)
let offset = 0
function writeStr(s) { buf.write(s, offset); offset += s.length }
function writeU16(v) { buf.writeUInt16LE(v, offset); offset += 2 }
function writeU32(v) { buf.writeUInt32LE(v, offset); offset += 4 }

writeStr('RIFF')
writeU32(36 + dataSize)
writeStr('WAVE')
writeStr('fmt ')
writeU32(16)
writeU16(1)
writeU16(numChannels)
writeU32(sampleRate)
writeU32(sampleRate * numChannels * (bitsPerSample / 8))
writeU16(numChannels * (bitsPerSample / 8))
writeU16(bitsPerSample)
writeStr('data')
writeU32(dataSize)

// 钢琴音色包络
function pianoEnv(t) {
  // attack 5ms, decay 1s, sustain 0.2, release
  if (t < 0.005) return t / 0.005
  if (t < 1.0) return 1 - (1 - 0.2) * ((t - 0.005) / 0.995)
  return 0.2 * Math.exp(-(t - 1.0) * 0.4)
}

// 合成一个钢琴音
function piano(freq, t, start, len=2) {
  const dt = t - start
  if (dt < 0 || dt > len) return 0
  const env = pianoEnv(dt)
  // 钢琴音色：基波 + 谐波
  return (
    Math.sin(2 * Math.PI * freq * dt) * 0.5 +
    Math.sin(2 * Math.PI * freq * 2 * dt) * 0.18 +
    Math.sin(2 * Math.PI * freq * 3 * dt) * 0.06 +
    Math.sin(2 * Math.PI * freq * 4 * dt) * 0.03 +
    Math.sin(2 * Math.PI * freq * 5 * dt) * 0.01
  ) * env
}

const bpm = 70
const beat = 60 / bpm          // 每拍秒数
const bar = beat * 4            // 每小节秒数

// 和弦：A, E, F#m, D 各4拍 → 循环16拍
const progression = [
  { chord: 'A',   bass: 110,   arp: [110, 164.81, 220, 277.18, 329.63, 440, 554.37, 659.25] },
  { chord: 'E',   bass: 82.41, arp: [82.41, 123.47, 164.81, 207.65, 329.63, 415.30, 659.25, 830.61] },
  { chord: 'F#m', bass: 92.5,  arp: [92.5, 138.59, 185, 233.08, 369.99, 466.16, 554.37, 739.99] },
  { chord: 'D',   bass: 73.42, arp: [73.42, 110, 146.83, 185, 293.66, 369.99, 440, 587.33] },
]

// 右手旋律（每拍一个音）
const melodyLines = {
  'A':   [523.25, 783.99, 659.25, 659.25, 523.25, 659.25, 783.99, 880,
          783.99, 659.25, 523.25, 493.88, 440,    523.25, 493.88, 440],
  'E':   [415.30, 523.25, 659.25, 554.37, 415.30, 493.88, 554.37, 659.25,
          554.37, 493.88, 415.30, 329.63, 415.30, 493.88, 554.37, 659.25],
  'F#m': [369.99, 554.37, 466.16, 369.99, 554.37, 466.16, 369.99, 329.63,
          415.30, 369.99, 329.63, 293.66, 369.99, 329.63, 293.66, 329.63],
  'D':   [293.66, 440,    369.99, 293.66, 440,    523.25, 587.33, 659.25,
          523.25, 440,    369.99, 329.63, 293.66, 329.63, 369.99, 440],
}

// 延迟缓冲区
const delaySec = 0.2
const delaySamples = Math.floor(sampleRate * delaySec)
const delayBuf = new Float64Array(delaySamples)
let delayIdx = 0

// 渲染所有采样
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate

  // 当前在第几个拍子
  const globalBeat = t / beat
  const beatIdx = Math.floor(globalBeat) % 16

  // 确定当前和弦段 (每4拍一个和弦)
  const progIdx = Math.floor(globalBeat / 4) % 4
  const prog = progression[progIdx]
  const localBeat = Math.floor(globalBeat) % 4  // 和弦内的拍子 0-3

  let sample = 0

  // === 左手分解和弦（每拍一个音） ===
  // 六个音一组：根音、五音、根音八度、三音、五音、根音
  const arpPattern = [
    prog.arp[0], prog.arp[4], prog.arp[6], prog.arp[3],
    prog.arp[4], prog.arp[7], prog.arp[6], prog.arp[5],
    prog.arp[0], prog.arp[3], prog.arp[5], prog.arp[2],
    prog.arp[4], prog.arp[6], prog.arp[7], prog.arp[5],
  ]
  const arpFreq = arpPattern[beatIdx]
  const arpStart = Math.floor(t / beat) * beat
  sample += piano(arpFreq, t, arpStart, beat * 0.85) * 0.35

  // === 低音（每两拍一个） ===
  if (beatIdx % 2 === 0) {
    const bassStart = Math.floor(t / (beat * 2)) * (beat * 2)
    sample += piano(prog.bass, t, bassStart, beat * 1.5) * 0.30
  }

  // === 右手旋律 ===
  const melody = melodyLines[prog.chord]
  if (melody && beatIdx < melody.length) {
    const melFreq = melody[beatIdx]
    const melStart = Math.floor(t / beat) * beat
    sample += piano(melFreq, t, melStart, beat * 0.75) * 0.30

    // 后附点装饰音（每两拍一个）
    if (beatIdx % 2 === 0 && beatIdx + 1 < melody.length) {
      const graceFreq = melody[beatIdx + 1] * 1.01
      const graceStart = melStart + beat * 0.4
      sample += piano(graceFreq, t, graceStart, beat * 0.35) * 0.12
    }
  }

  // === 混响 (simple delay) ===
  const dry = sample
  delayBuf[delayIdx] = dry
  delayIdx = (delayIdx + 1) % delaySamples
  const wet = delayBuf[delayIdx] * 0.25
  sample = dry * 0.75 + wet

  // 淡入淡出
  const fadeLen = sampleRate * 0.3
  if (i < fadeLen) sample *= i / fadeLen
  if (i > numSamples - fadeLen) sample *= (numSamples - i) / fadeLen

  sample = Math.max(-0.7, Math.min(0.7, sample))
  buf.writeInt16LE(Math.round(sample * 0x7FFF), offset)
  offset += 2
}

const outPath = path.join(__dirname, 'public', 'bgm.wav')
fs.writeFileSync(outPath, buf)
console.log(`✅ 已生成钢琴曲: ${outPath} (${(buf.length / 1024).toFixed(0)} KB)`)
console.log('   柔和钢琴 A→E→F#m→D 16拍循环 + 混响')
