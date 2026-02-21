// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
// Sitemap: single custom sitemap at src/pages/sitemap.xml.ts (referenced in robots.txt).
// @astrojs/sitemap removed to avoid duplicate/conflicting sitemap URLs and trailing-slash mismatch.
export default defineConfig({
    site: 'https://gamelayer.io',
    output: 'server', // Server mode enables API routes (Vercel adapter handles serverless functions)
    adapter: vercel({
        webAnalytics: { enabled: false }
    }),
    integrations: [],
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