export type FederationManifest = Record<string, string>;

export interface RemoteEntry {
  name: string;
  shared: { packageName: string }[];
  exposes: { key: string; outFileName: string }[];
}

export interface RemoteSources {
  fetchJson: (url: string) => Promise<unknown>;
  importModule: (url: string) => Promise<unknown>;
}

export class RemoteLoadError extends Error {
  readonly remoteName: string;

  constructor(remoteName: string, message: string, options?: ErrorOptions) {
    super(`${remoteName}: ${message}`, options);
    this.remoteName = remoteName;
  }
}

export function resolveExposedModuleUrl(
  remoteName: string,
  remoteEntryUrl: string,
  remoteEntry: RemoteEntry,
  exposedModule: string,
): string {
  if (remoteEntry.name !== remoteName) {
    throw new RemoteLoadError(
      remoteName,
      `remoteEntry belongs to "${remoteEntry.name}"`,
    );
  }
  if (remoteEntry.shared.length > 0) {
    const packages = remoteEntry.shared.map((external) => external.packageName);
    throw new RemoteLoadError(
      remoteName,
      `islands only accept self-contained remotes, but it shares ${packages.join(', ')}`,
    );
  }
  const exposed = remoteEntry.exposes.find(({ key }) => key === exposedModule);
  if (!exposed) {
    throw new RemoteLoadError(remoteName, `does not expose "${exposedModule}"`);
  }
  return new URL(exposed.outFileName, remoteEntryUrl).href;
}

export async function loadExposedModule<T>(
  manifestUrl: string,
  remoteName: string,
  exposedModule: string,
  sources: RemoteSources,
): Promise<T> {
  try {
    const manifest = (await sources.fetchJson(manifestUrl)) as FederationManifest;
    const remoteEntryUrl = manifest[remoteName];
    if (!remoteEntryUrl) {
      throw new RemoteLoadError(remoteName, 'is missing in the manifest');
    }
    const remoteEntry = (await sources.fetchJson(remoteEntryUrl)) as RemoteEntry;
    const moduleUrl = resolveExposedModuleUrl(
      remoteName,
      remoteEntryUrl,
      remoteEntry,
      exposedModule,
    );
    return (await sources.importModule(moduleUrl)) as T;
  } catch (err) {
    if (err instanceof RemoteLoadError) {
      throw err;
    }
    throw new RemoteLoadError(remoteName, 'could not be loaded', { cause: err });
  }
}
