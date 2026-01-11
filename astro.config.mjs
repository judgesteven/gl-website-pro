// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
    site: 'https://gamelayer.io',
    output: 'server', // Server mode enables API routes (Vercel adapter handles serverless functions)
    adapter: vercel({
        webAnalytics: { enabled: false }
    }),
    integrations: [
        sitemap({
            filter: (page) => {
                // Only include real pages, not sections
                return !page.includes('#');
            }
        })
    ],
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