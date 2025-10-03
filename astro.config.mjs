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
                    manualChunks: undefined,
                    assetFileNames: (assetInfo) => {
                        if (!assetInfo.name) return `_astro/[name].[hash].[ext]`;
                        const info = assetInfo.name.split('.');
                        const ext = info[info.length - 1];
                        if (/\.(css)$/.test(assetInfo.name)) {
                            return `_astro/[name]-${Date.now()}.${ext}`;
                        }
                        return `_astro/[name].[hash].${ext}`;
                    }
                }
            }
        }
    }
});