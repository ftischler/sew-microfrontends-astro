import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import {
  resolveExposedModuleUrl,
  type FederationManifest,
  type RemoteEntry,
} from '../src/remotes/remote-entry.ts';
import { remotes } from '../src/remotes/remotes.ts';

async function readJson(location: string): Promise<unknown> {
  if (/^https?:\/\//.test(location)) {
    const response = await fetch(location);
    if (!response.ok) {
      throw new Error(`${location} returned ${response.status}`);
    }
    return response.json();
  }
  return JSON.parse(await readFile(location, 'utf8'));
}

async function checkRemote(
  remoteName: string,
  remoteEntryUrl: string | undefined,
  exposedModule: string,
): Promise<string | undefined> {
  if (!remoteEntryUrl) {
    return 'missing in the manifest';
  }
  try {
    const remoteEntry = (await readJson(remoteEntryUrl)) as RemoteEntry;
    resolveExposedModuleUrl(remoteName, remoteEntryUrl, remoteEntry, exposedModule);
    return undefined;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

const { values } = parseArgs({
  options: { manifest: { type: 'string', default: 'public/federation.manifest.json' } },
});
const manifest = (await readJson(values.manifest)) as FederationManifest;

let failed = 0;
for (const [remoteName, { exposedModule }] of Object.entries(remotes)) {
  const problem = await checkRemote(remoteName, manifest[remoteName], exposedModule);
  if (problem) {
    failed++;
    console.log(`✗ ${remoteName}: ${problem}`);
  } else {
    console.log(`✓ ${remoteName}: self-contained, exposes ${exposedModule}`);
  }
}
process.exitCode = failed ? 1 : 0;
