// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    site: 'https://gamelayer.io',
    output: 'static',
    devToolbar: {
        enabled: false
    },
    build: {
        assets: '_astro'
    },
    compressHTML: true,
    prefetch: {
        prefetchAll: true,
        defaultStrategy: 'viewport'
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