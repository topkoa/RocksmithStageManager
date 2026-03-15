import type { PsarcHeader, TocEntry } from '../types/psarc';
import { HEADER_SIZE, ARC_KEY, ARC_IV } from './constants';
import aesjs from 'aes-js';

export function decryptToc(buffer: ArrayBuffer, header: PsarcHeader): Uint8Array {
  const tocDataLength = header.tocSize - HEADER_SIZE;
  const encrypted = new Uint8Array(buffer, HEADER_SIZE, tocDataLength);

  // AES-256-CFB decryption with 16-byte segment size
  // aes-js requires input to be a multiple of segment size (16 bytes), so pad if needed
  const segmentSize = 16;
  const paddedLength = Math.ceil(encrypted.length / segmentSize) * segmentSize;
  let input = encrypted;
  if (encrypted.length % segmentSize !== 0) {
    input = new Uint8Array(paddedLength);
    input.set(encrypted);
  }

  const aesCfb = new aesjs.ModeOfOperation.cfb(
    Array.from(ARC_KEY),
    Array.from(ARC_IV),
    segmentSize
  );

  const decrypted = new Uint8Array(aesCfb.decrypt(input));
  // Return only the original length (trim padding)
  return decrypted.subarray(0, tocDataLength);
}

function read40BitBE(data: Uint8Array, offset: number): number {
  const high = data[offset]!;
  const low =
    (data[offset + 1]! << 24) |
    (data[offset + 2]! << 16) |
    (data[offset + 3]! << 8) |
    data[offset + 4]!;
  return high * 0x100000000 + (low >>> 0);
}

export function parseTocEntries(
  tocData: Uint8Array,
  header: PsarcHeader
): { entries: TocEntry[]; blockSizes: number[] } {
  const entries: TocEntry[] = [];
  const entrySize = header.entrySize;

  for (let i = 0; i < header.numEntries; i++) {
    const off = i * entrySize;
    const md5 = tocData.slice(off, off + 16);
    const zIndex =
      (tocData[off + 16]! << 24) |
      (tocData[off + 17]! << 16) |
      (tocData[off + 18]! << 8) |
      tocData[off + 19]!;
    const length = read40BitBE(tocData, off + 20);
    const offset = read40BitBE(tocData, off + 25);

    entries.push({ md5, zIndex: zIndex >>> 0, length, offset });
  }

  // Parse block sizes table after TOC entries
  const blockSizeTableOffset = header.numEntries * entrySize;
  const blockSizes: number[] = [];

  // Block size entries are uint16 when blockSize <= 65536
  const bsEntryWidth = header.blockSize <= 65536 ? 2 : header.blockSize <= 16777216 ? 3 : 4;
  const remaining = tocData.length - blockSizeTableOffset;
  const numBlockSizes = Math.floor(remaining / bsEntryWidth);

  for (let i = 0; i < numBlockSizes; i++) {
    const bOff = blockSizeTableOffset + i * bsEntryWidth;
    let size: number;
    if (bsEntryWidth === 2) {
      size = (tocData[bOff]! << 8) | tocData[bOff + 1]!;
    } else if (bsEntryWidth === 3) {
      size = (tocData[bOff]! << 16) | (tocData[bOff + 1]! << 8) | tocData[bOff + 2]!;
    } else {
      size =
        (tocData[bOff]! << 24) |
        (tocData[bOff + 1]! << 16) |
        (tocData[bOff + 2]! << 8) |
        tocData[bOff + 3]!;
      size = size >>> 0;
    }
    blockSizes.push(size);
  }

  return { entries, blockSizes };
}
