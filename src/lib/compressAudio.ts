// lamejs is a CommonJS library; use a wildcard import so Vite's CJS interop
// exposes the full module (Mp3Encoder, etc.) without "MPEGMode is not defined" errors.
// @ts-ignore — lamejs has no TypeScript declarations
import * as lamejsModule from 'lamejs';
// Handle both default-export and namespace shapes produced by bundlers
const lamejs: any = (lamejsModule as any).default || lamejsModule;

const COMPRESS_THRESHOLD = 40 * 1024 * 1024; // 40 MB
const MP3_KBPS = 320;
const CHUNK_SIZE = 1152; // standard MP3 frame size

function floatToInt16(float32: Float32Array): Int16Array {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 32768 : s * 32767;
  }
  return out;
}

export async function compressAudio(file: File): Promise<File> {
  if (file.size <= COMPRESS_THRESHOLD) return file;

  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new AudioContext();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    audioCtx.close();
  }

  const numChannels = Math.min(audioBuffer.numberOfChannels, 2);
  const sampleRate = audioBuffer.sampleRate;
  const encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, MP3_KBPS);

  const left = floatToInt16(audioBuffer.getChannelData(0));
  const right = numChannels > 1 ? floatToInt16(audioBuffer.getChannelData(1)) : null;

  const chunks: Int8Array[] = [];
  const totalSamples = left.length;

  for (let offset = 0; offset < totalSamples; offset += CHUNK_SIZE) {
    const leftChunk = left.subarray(offset, offset + CHUNK_SIZE);
    const encoded = right
      ? encoder.encodeBuffer(leftChunk, right.subarray(offset, offset + CHUNK_SIZE))
      : encoder.encodeBuffer(leftChunk);
    if (encoded.length > 0) chunks.push(encoded);
  }

  const flushed = encoder.flush();
  if (flushed.length > 0) chunks.push(flushed);

  const blob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
  const mp3Name = file.name.replace(/\.[^/.]+$/, '') + '.mp3';
  return new File([blob], mp3Name, { type: 'audio/mpeg' });
}
