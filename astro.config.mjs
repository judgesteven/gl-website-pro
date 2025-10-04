// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
    site: 'https://gamelayer.io',
    output: 'static',
    adapter: vercel({
        webAnalytics: { enabled: false }
    }),
    devToolbar: {
        enabled: false
    },
    build: {
        assets: '_astro'
    },
    vite: {
        css: {
            preprocessorOptions: {
                scss: {
                    api: 'modern-compiler'
                }
            }
        },
        build: {
            cssCodeSplit: false,
            rollupOptions: {
                output: {
                    manualChunks: undefined
                }
            }
        }
    }
});