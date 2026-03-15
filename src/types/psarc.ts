export interface PsarcHeader {
  magic: number;
  version: number;
  compression: string;
  tocSize: number;
  entrySize: number;
  numEntries: number;
  blockSize: number;
  archiveFlags: number;
}

export interface TocEntry {
  md5: Uint8Array;
  zIndex: number;
  length: number;
  offset: number;
}
