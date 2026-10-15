export interface RemoteConfig {
  exposedModule: string;
  register: string;
  tag: string;
  navigateEvent: string;
  paths: string[];
}

export const remotes = {
  mfe3: {
    exposedModule: './web-component',
    register: 'registerMfe3Element',
    tag: 'sew-mfe3',
    navigateEvent: 'mfe3-navigate',
    paths: ['', 'details'],
  },
} satisfies Record<string, RemoteConfig>;
