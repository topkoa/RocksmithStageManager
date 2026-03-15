import { useState, useCallback } from 'react';
import { parsePsarcFiles } from '../psarc/index';
import type { Song } from '../types/song';

interface FileLoaderState {
  loading: boolean;
  progress: { completed: number; total: number; current: string };
  errors: Array<{ file: string; error: string }>;
}

export function useFileLoader(onSongsLoaded: (songs: Song[]) => void) {
  const [state, setState] = useState<FileLoaderState>({
    loading: false,
    progress: { completed: 0, total: 0, current: '' },
    errors: [],
  });

  const loadFiles = useCallback(async (files: File[]) => {
    const psarcFiles = files.filter(f =>
      f.name.toLowerCase().endsWith('.psarc')
    );

    if (psarcFiles.length === 0) {
      setState(prev => ({
        ...prev,
        errors: [{ file: '', error: 'No .psarc files found' }],
      }));
      return;
    }

    setState({
      loading: true,
      progress: { completed: 0, total: psarcFiles.length, current: '' },
      errors: [],
    });

    const { songs, errors } = await parsePsarcFiles(
      psarcFiles,
      (completed, total, current) => {
        setState(prev => ({
          ...prev,
          progress: { completed, total, current },
        }));
      }
    );

    setState({ loading: false, progress: { completed: psarcFiles.length, total: psarcFiles.length, current: 'Done' }, errors });
    onSongsLoaded(songs);
  }, [onSongsLoaded]);

  const loadFromDirectory = useCallback(async () => {
    try {
      // Try File System Access API first
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
        const files: File[] = [];

        // Use entries() iterator - cast needed for TS compatibility
        const iter = (dirHandle as unknown as AsyncIterable<[string, FileSystemHandle]>)[Symbol.asyncIterator]();
        let result = await iter.next();
        while (!result.done) {
          const [, handle] = result.value;
          if (handle.kind === 'file' && handle.name.toLowerCase().endsWith('.psarc')) {
            files.push(await (handle as FileSystemFileHandle).getFile());
          }
          result = await iter.next();
        }

        await loadFiles(files);
        return;
      }
    } catch (err) {
      // User cancelled or API not available
      if ((err as Error).name === 'AbortError') return;
    }

    // Fallback: trigger file input
    triggerFileInput();
  }, [loadFiles]);

  const triggerFileInput = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.psarc';
    input.setAttribute('webkitdirectory', '');
    input.onchange = async () => {
      if (input.files) {
        await loadFiles(Array.from(input.files));
      }
    };
    input.click();
  }, [loadFiles]);

  return {
    ...state,
    loadFromDirectory,
    loadFiles,
  };
}
