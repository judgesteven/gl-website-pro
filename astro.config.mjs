// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
    output: 'static',
    adapter: vercel({
        webAnalytics: { enabled: false }
    }),
    devToolbar: {
        enabled: false
    },
    build: {
        inlineStylesheets: 'auto',
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
