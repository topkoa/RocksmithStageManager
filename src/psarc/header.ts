import type { PsarcHeader } from '../types/psarc';
import { PSARC_MAGIC, HEADER_SIZE } from './constants';

export function parseHeader(buffer: ArrayBuffer): PsarcHeader {
  if (buffer.byteLength < HEADER_SIZE) {
    throw new Error('File too small to be a PSARC archive');
  }

  const view = new DataView(buffer);
  const magic = view.getUint32(0, false);

  if (magic !== PSARC_MAGIC) {
    throw new Error('Invalid PSARC file: bad magic bytes');
  }

  const version = view.getUint32(4, false);

  // Compression type is 4 ASCII bytes
  const compBytes = new Uint8Array(buffer, 8, 4);
  const compression = String.fromCharCode(...compBytes);

  const tocSize = view.getUint32(12, false);
  const entrySize = view.getUint32(16, false);
  const numEntries = view.getUint32(20, false);
  const blockSize = view.getUint32(24, false);
  const archiveFlags = view.getUint32(28, false);

  if (entrySize !== 30) {
    throw new Error(`Unexpected TOC entry size: ${entrySize}`);
  }

  return {
    magic,
    version,
    compression,
    tocSize,
    entrySize,
    numEntries,
    blockSize,
    archiveFlags,
  };
}
