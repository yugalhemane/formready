import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import site from './site.config.json' with { type: 'json' };

const adsenseVerification = site.adsensePublisherId
  ? `<meta name="google-adsense-account" content="${site.adsensePublisherId}">`
  : '';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'formready-adsense-verification',
      transformIndexHtml(html) {
        return html.replace('</head>', `${adsenseVerification}</head>`);
      },
    },
  ],
});
