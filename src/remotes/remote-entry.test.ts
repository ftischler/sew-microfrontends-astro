import { describe, expect, it, vi } from 'vitest';
import {
  loadExposedModule,
  RemoteLoadError,
  resolveExposedModuleUrl,
  type RemoteEntry,
} from './remote-entry.ts';

const remoteEntryUrl = 'https://mfe3.example/remoteEntry.json';

const mfe3Entry: RemoteEntry = {
  name: 'mfe3',
  shared: [],
  exposes: [{ key: './web-component', outFileName: 'web-component-ABC.js' }],
};

describe('resolveExposedModuleUrl', () => {
  it('resolves the exposed file next to the remoteEntry', () => {
    expect(
      resolveExposedModuleUrl('mfe3', remoteEntryUrl, mfe3Entry, './web-component'),
    ).toBe('https://mfe3.example/web-component-ABC.js');
  });

  it('rejects a remote that expects shared packages from the host', () => {
    const sharing = {
      ...mfe3Entry,
      shared: [{ packageName: '@angular/core' }],
    };
    expect(() =>
      resolveExposedModuleUrl('mfe3', remoteEntryUrl, sharing, './web-component'),
    ).toThrow('islands only accept self-contained remotes, but it shares @angular/core');
  });

  it('rejects a remoteEntry of another remote', () => {
    expect(() =>
      resolveExposedModuleUrl('mfe4', remoteEntryUrl, mfe3Entry, './web-component'),
    ).toThrow('remoteEntry belongs to "mfe3"');
  });

  it('rejects a module the remote does not expose', () => {
    expect(() =>
      resolveExposedModuleUrl('mfe3', remoteEntryUrl, mfe3Entry, './routes'),
    ).toThrow('does not expose "./routes"');
  });
});

describe('loadExposedModule', () => {
  const manifest = { mfe3: remoteEntryUrl };

  it('loads the exposed module through manifest and remoteEntry', async () => {
    const exposed = { registerMfe3Element: vi.fn() };
    const importModule = vi.fn().mockResolvedValue(exposed);
    const fetchJson = vi.fn(async (url: string) =>
      url === '/federation.manifest.json' ? manifest : mfe3Entry,
    );

    await expect(
      loadExposedModule('/federation.manifest.json', 'mfe3', './web-component', {
        fetchJson,
        importModule,
      }),
    ).resolves.toBe(exposed);
    expect(importModule).toHaveBeenCalledWith(
      'https://mfe3.example/web-component-ABC.js',
    );
  });

  it('wraps network failures in a RemoteLoadError', async () => {
    const offline = loadExposedModule(
      '/federation.manifest.json',
      'mfe3',
      './web-component',
      {
        fetchJson: async (url) => {
          if (url === remoteEntryUrl) {
            throw new TypeError('Failed to fetch');
          }
          return manifest;
        },
        importModule: vi.fn(),
      },
    );

    await expect(offline).rejects.toBeInstanceOf(RemoteLoadError);
    await expect(offline).rejects.toThrow('mfe3: could not be loaded');
  });

  it('fails for a remote missing in the manifest', async () => {
    await expect(
      loadExposedModule('/federation.manifest.json', 'mfe9', './web-component', {
        fetchJson: async () => manifest,
        importModule: vi.fn(),
      }),
    ).rejects.toThrow('mfe9: is missing in the manifest');
  });
});
