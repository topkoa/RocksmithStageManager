import type { Song } from '../types/song';
import { parseHeader } from './header';
import { decryptToc, parseTocEntries } from './toc';
import { extractEntry } from './extractor';
import { parseManifest } from './manifest';

export async function parsePsarcFile(file: File): Promise<Song[]> {
  const buffer = await file.arrayBuffer();
  const header = parseHeader(buffer);
  const tocData = decryptToc(buffer, header);
  const { entries, blockSizes } = parseTocEntries(tocData, header);

  if (entries.length === 0) {
    throw new Error('PSARC archive has no entries');
  }

  // Entry 0 is always the file listing (manifest of paths)
  const fileListData = extractEntry(buffer, entries[0]!, blockSizes, header.blockSize);
  const fileListing = new TextDecoder().decode(fileListData).trim().split('\n');

  // Find .hsan file (summary manifest) - most efficient for metadata
  const hsanIndex = fileListing.findIndex(p => p.endsWith('.hsan'));

  if (hsanIndex >= 0) {
    // +1 because entry 0 is the file listing itself, entry 1 maps to fileListing[0]
    const manifestData = extractEntry(
      buffer,
      entries[hsanIndex + 1]!,
      blockSizes,
      header.blockSize
    );
    const manifestJson = JSON.parse(new TextDecoder().decode(manifestData));
    return parseManifest(manifestJson, file.name);
  }

  // Fallback: look for individual JSON manifest files
  const manifestIndices = fileListing
    .map((path, idx) => ({ path, idx }))
    .filter(({ path }) =>
      path.includes('manifests/') && path.endsWith('.json')
    );

  if (manifestIndices.length === 0) {
    throw new Error('No manifest found in PSARC file');
  }

  // Parse first manifest to get song info
  const firstManifest = manifestIndices[0]!;
  const manifestData = extractEntry(
    buffer,
    entries[firstManifest.idx + 1]!,
    blockSizes,
    header.blockSize
  );
  const manifestJson = JSON.parse(new TextDecoder().decode(manifestData));
  return parseManifest(manifestJson, file.name);
}

export async function parsePsarcFiles(
  files: File[],
  onProgress?: (completed: number, total: number, current: string) => void
): Promise<{ songs: Song[]; errors: Array<{ file: string; error: string }> }> {
  const allSongs: Song[] = [];
  const errors: Array<{ file: string; error: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    onProgress?.(i, files.length, file.name);

    try {
      const songs = await parsePsarcFile(file);
      allSongs.push(...songs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      errors.push({ file: file.name, error: message });
      console.error(`Failed to parse ${file.name}:`, err);
    }

    // Yield to UI thread between files
    if (i % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  onProgress?.(files.length, files.length, 'Done');
  return { songs: allSongs, errors };
}
