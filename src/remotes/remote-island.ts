import { loadExposedModule, RemoteLoadError } from './remote-entry.ts';

type RemoteElement = HTMLElement & { path: string };

const browserSources = {
  fetchJson: async (url: string) => {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`${url} returned ${response.status}`);
    }
    return response.json();
  },
  importModule: (url: string) => import(/* @vite-ignore */ url),
};

class RemoteIsland extends HTMLElement {
  private remoteElement?: RemoteElement;

  private readonly syncPath = () => {
    if (this.remoteElement) {
      this.remoteElement.path = this.currentSubPath();
    }
  };

  connectedCallback(): void {
    window.addEventListener('popstate', this.syncPath);
    void this.mount();
  }

  disconnectedCallback(): void {
    window.removeEventListener('popstate', this.syncPath);
  }

  private get basePath(): string {
    return this.getAttribute('base-path') ?? '';
  }

  private currentSubPath(): string {
    return location.pathname
      .slice(this.basePath.length)
      .replace(/^\/+|\/+$/g, '');
  }

  private async mount(): Promise<void> {
    const remoteName = this.getAttribute('remote') ?? '';
    this.showStatus(`Loading ${remoteName} ...`);
    try {
      const module = await loadExposedModule<Record<string, () => Promise<void>>>(
        '/federation.manifest.json',
        remoteName,
        this.getAttribute('exposed-module') ?? '',
        browserSources,
      );
      await module[this.getAttribute('register') ?? '']?.();
      this.renderRemote(this.getAttribute('tag') ?? '');
    } catch (err) {
      console.error(err);
      this.renderUnavailable(
        err instanceof RemoteLoadError ? err.remoteName : remoteName,
      );
    }
  }

  private renderRemote(tag: string): void {
    const element = document.createElement(tag) as RemoteElement;
    element.path = this.currentSubPath();
    element.addEventListener(
      this.getAttribute('navigate-event') ?? 'navigate',
      (event) => {
        const subPath = (event as CustomEvent<string>).detail;
        history.pushState(null, '', [this.basePath, subPath].filter(Boolean).join('/'));
        this.syncPath();
      },
    );
    this.remoteElement = element;
    this.replaceChildren(element);
  }

  private renderUnavailable(remoteName: string): void {
    const heading = document.createElement('h2');
    heading.textContent = `${remoteName} is currently unavailable`;
    const text = document.createElement('p');
    text.textContent = 'The rest of the application keeps working.';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Try again';
    retry.addEventListener('click', () => void this.mount());
    this.replaceChildren(heading, text, retry);
  }

  private showStatus(message: string): void {
    const status = document.createElement('p');
    status.textContent = message;
    this.replaceChildren(status);
  }
}

customElements.define('remote-island', RemoteIsland);
