// @ts-check
import angular from '@analogjs/astro-angular';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [
    angular({
      vite: {
        transformFilter: (_code, id) => id.includes('src/microfrontends'),
      },
    }),
  ],
});
