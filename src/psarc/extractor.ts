import type { TocEntry } from '../types/psarc';
import pako from 'pako';

export function extractEntry(
  buffer: ArrayBuffer,
  entry: TocEntry,
  blockSizes: number[],
  blockSize: number
): Uint8Array {
  if (entry.length === 0) {
    return new Uint8Array(0);
  }

  const result = new Uint8Array(entry.length);
  let destOffset = 0;
  let blockIndex = entry.zIndex;
  let srcOffset = entry.offset;

  while (destOffset < entry.length) {
    const compressedSize = blockSizes[blockIndex];
    if (compressedSize === undefined) {
      throw new Error(`Block index ${blockIndex} out of range (${blockSizes.length} blocks)`);
    }

    const remaining = entry.length - destOffset;

    if (compressedSize === 0) {
      // Uncompressed full block
      const copyLen = Math.min(blockSize, remaining);
      const raw = new Uint8Array(buffer, srcOffset, copyLen);
      result.set(raw, destOffset);
      destOffset += copyLen;
      srcOffset += blockSize;
    } else {
      // Compressed block
      const compressed = new Uint8Array(buffer, srcOffset, compressedSize);

      // Check if this block is actually compressed (zlib header starts with 0x78)
      if (compressed[0] === 0x78) {
        const decompressed = pako.inflate(compressed);
        const copyLen = Math.min(decompressed.length, remaining);
        result.set(decompressed.subarray(0, copyLen), destOffset);
        destOffset += copyLen;
      } else {
        // Raw block stored with size (not actually compressed)
        const copyLen = Math.min(compressedSize, remaining);
        result.set(compressed.subarray(0, copyLen), destOffset);
        destOffset += copyLen;
      }
      srcOffset += compressedSize;
    }
    blockIndex++;
  }

  return result;
}
